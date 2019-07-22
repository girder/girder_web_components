<script>
import { sizeFormatter } from '../utils/mixins';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderDataTable from './Presentation/DataTable.vue';
import { createLocationValidator } from '../utils';

const GIRDER_FOLDER_ENDPOINT = 'folder';
const GIRDER_ITEM_ENDPOINT = 'item';

export default {
  components: {
    GirderBreadcrumb,
    GirderDataTable,
  },
  mixins: [sizeFormatter],
  props: {
    draggable: {
      type: Boolean,
      default: false,
    },
    location: {
      type: Object,
      default: () => ({
        type: 'root',
      }),
      validator: createLocationValidator(true),
    },
    selection: {
      type: Boolean,
      default: false,
    },
    noRootLocation: {
      type: Boolean,
      default: false,
    },
    upload: {
      type: Boolean,
      default: false,
    },
    newFolder: {
      type: Boolean,
      default: false,
    },
  },
  inject: ['girderRest'],
  data() {
    return {
      pagination: {
        rowsPerPage: 10,
        page: 1,
      },
      refreshCounter_: 0,
      rows: [],
      rowsLoading: false,
      selected: [],
      // make an internal copy so doesn't have to require the location prop
      location_: this.location,
    };
  },
  computed: {
    loading() {
      return (this.$refs.breadcrumb && this.$refs.breadcrumb.loading) || this.rowsLoading;
    },
    totalItems() {
      return Object.values(this.counts).reduce(
        (total, value) => total + value,
        0,
      );
    },
    selection_() {
      if (!this.location_) {
        return false;
      }
      const { type } = this.location_;
      return (
        this.selection &&
        ['root', 'users', 'collections'].indexOf(type) === -1
      );
    },
    isNonRootLocation() {
      return createLocationValidator(false)(this.location_);
    },
  },
  asyncComputed: {
    counts: {
      default: {
        nFolders: 0,
        nItems: 0,
        nUsers: 0,
        nCollections: 0,
      },
      async get() {
        this.rows = [];
        const counts = {
          nFolders: 0,
          nItems: 0,
          nUsers: 0,
          nCollections: 0,
        };
        const type = this.location_._modelType || this.location_.type;
        const { _id } = this.location_;
        if (['folder', 'user', 'collection'].indexOf(type) !== -1) {
          const { data } = await this.girderRest.get(`${type}/${_id}/details`);
          return {
            ...counts,
            ...{
              nFolders: data.nFolders || 0,
              nItems: data.nItems || 0,
            },
          };
        } else if (type === 'users' || type === 'collections') {
          const { data } = await this.girderRest.get(`${this.getResourceType(type)}/details`);
          return {
            ...counts,
            ...{
              [Object.keys(data)[0]]: Object.values(data)[0],
            },
          };
        } else if (type === 'root') {
          return { ...counts, ...{ nUsers: 1, nCollections: 1 } };
        }
        return counts;
      },
      watch() {
        return [this.refreshCounter_, this.location_, this.girderRest.user];
      },
    },
  },
  watch: {
    location(location) {
      if (createLocationValidator(!this.noRootLocation)(location)) {
        this.location_ = location;
        // force reset pagination when location changes.
        this.pagination.page = 1;
      }
    },
    selected(newval) {
      this.$emit('selection-changed', newval);
    },
    async counts() {
      this.rows = await this.fetchPaginatedRows();
    },
    // Not triggered by location pagination reset because deep==false
    async pagination() {
      this.rows = await this.fetchPaginatedRows();
    },
  },
  created() {
    if (!createLocationValidator(false)(this.location_) && this.noRootLocation) {
      throw new Error("Root location can't be used with no-root-location prop at the same time");
    }
  },
  methods: {
    toggleAll() {
      if (this.selected.length === this.rows.length) {
        this.selected = [];
      } else {
        this.selected = this.rows.slice();
      }
    },
    rowClick(item) {
      const { _modelType, _id } = item;
      const type = this.location_._modelType || this.location_.type;
      if (
        (this.location_.id !== _id || type !== _modelType) &&
        _modelType !== 'item'
      ) {
        if (['collections', 'users', 'root'].indexOf(_modelType) !== -1) {
          this.changeLocation({ type: _modelType });
        } else {
          this.changeLocation(item);
        }
      } else {
        this.$emit('itemclick', item);
      }
    },
    changeLocation(location) {
      const newType = location._modelType || location.type;
      const oldType = this.location_._modelType || this.location_.type;
      if (this.location_._id !== location._id || newType !== oldType) {
        this.location_ = location;
        this.$emit('update:location', location);
      }
    },
    refresh() {
      this.refreshCounter_ += 1;
    },
    async fetchPaginatedRows() {
      if (this.counts.nFolders || this.counts.nItems) {
        return this.fetchPaginatedFolderRows();
      }
      const type = this.location_._modelType || this.location_.type;
      if (type === 'users' || type === 'collections') {
        if (this.counts.nUsers || this.counts.nCollections) {
          return this.fetchPaginatedCollectionOrUserRows(this.getResourceType(type));
        }
      } else if (type === 'root') {
        return this.generateRootRows();
      }
      return [];
    },
    async fetchPaginatedFolderRows() {
      this.rowsLoading = true;
      const { counts, location_, pagination } = this;
      const { page, rowsPerPage } = pagination;
      const folderParams = {
        parentType: location_._modelType,
        parentId: location_._id,
        limit: rowsPerPage >= 0 ? rowsPerPage : null,
        offset: (page - 1) * rowsPerPage,
      };
      const itemLimit = counts.nFolders > folderParams.offset
        // if there are any folders on the current page,
        // the numer of items to fetch is based on the number of folders
        ? rowsPerPage - (counts.nFolders - folderParams.offset)
        // else the page will be comprised of only items
        : rowsPerPage;
      const itemOffset = folderParams.offset - counts.nFolders;
      const itemParams = {
        folderId: location_._id,
        limit: rowsPerPage >= 0 ? itemLimit : null,
        offset: itemOffset > 0 ? itemOffset : 0,
      };
      const promises = [];
      promises.push(this.girderRest.get(GIRDER_FOLDER_ENDPOINT, { params: folderParams }));
      // a limit of < 0 signifies the current page only includes folders
      // a limit of null signifies no pagination: fetch all entities
      if (
        (itemParams.limit > 0 || itemParams.limit === null) &&
        location_._modelType === 'folder'
      ) {
        promises.push(this.girderRest.get(GIRDER_ITEM_ENDPOINT, { params: itemParams }));
      }
      const responses = (await Promise.all(promises)).map(response => response.data);
      const rows = [].concat.apply(...responses).map(item => ({
        ...item,
        size: item.size ? this.formatSize(item.size) : '',
        icon: item._modelType in this.$vuetify.icons
          ? item._modelType
          : 'file',
      }));
      this.rowsLoading = false;
      return rows;
    },
    async fetchPaginatedCollectionOrUserRows(type) {
      this.rowsLoading = true;
      const { page, rowsPerPage } = this.pagination;
      const { data: items } = await this.girderRest.get(type, {
        params: {
          limit: rowsPerPage >= 0 ? rowsPerPage : null,
          offset: (page - 1) * rowsPerPage,
        },
      });
      const rows = items.map(item => ({
        ...item,
        name:
          item._modelType === 'user'
            ? `${item.firstName} ${item.lastName}`
            : item.name,
        size: item.size ? this.formatSize(item.size) : '',
        icon: item._modelType,
      }));
      this.rowsLoading = false;
      return rows;
    },
    generateRootRows() {
      const rows = [
        { _modelType: 'collections', name: 'Collections', icon: 'collection' },
      ];
      if (this.girderRest.user) {
        rows.push({ _modelType: 'users', name: 'Users', icon: 'user' });
      }
      return rows;
    },
    getResourceType(locationType) {
      switch (locationType) {
        case 'collections':
          return 'collection';
        case 'users':
          return 'user';
        default:
          return '';
      }
    },
  },
};
</script>

<template lang="pug">
girder-data-table.girder-file-browser(
    v-model="selected",
    :draggable="draggable",
    :rows="rows",
    :pagination.sync="pagination",
    :total-items="totalItems",
    :loading="loading",
    :selection="selection_",
    @rowclick="rowClick",
    @drag="$emit('drag', $event)",
    @dragstart="$emit('dragstart', $event)",
    @dragend="$emit('dragend', $event)",
    @drop="$emit('drop', $event)")

  template(slot="header", slot-scope="props")
    tr.secondary.lighten-5
      th.pl-3.pr-0(width="1%", v-if="selection_")
        v-checkbox.secondary--text.text--darken-1.pr-2(
            color="accent",
            hide-details,
            :input-value="props.all",
            :indeterminate="selected.length > 0 && !props.all",
            @click.native="toggleAll")
      th.pl-3(colspan="100", width="99%")
        v-layout(row, align-center)
          girder-breadcrumb(
              ref="breadcrumb",
              :location="location_",
              @crumbclick="changeLocation",
              :root-location="!noRootLocation")
          v-spacer
          slot(name="headerwidget")
          v-btn.ma-0(flat,
              small,
              color="secondary darken-2",
              v-if="newFolder && isNonRootLocation",
              @click="$emit('click:newfolder')")
            v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.folderNew }}
            span.hidden-xs-only New Folder
          v-btn.ma-0(flat,
              small,
              color="secondary darken-2",
              v-if="upload && isNonRootLocation",
              @click="$emit('click:newitem')")
            v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.fileUpload }}
            span.hidden-xs-only Upload Item
</template>
