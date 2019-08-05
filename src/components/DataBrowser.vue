<script>
import { sizeFormatter } from '../utils/mixins';
import GirderDataTable from './Presentation/DataTable.vue';
import {
  createLocationValidator,
  getLocationType,
  getSingularLocationTypeName,
  isRootLocation,
} from '../utils';

const GIRDER_FOLDER_ENDPOINT = 'folder';
const GIRDER_ITEM_ENDPOINT = 'item';

export default {
  components: {
    GirderDataTable,
  },

  mixins: [sizeFormatter],
  inject: ['girderRest'],
  props: {
    draggable: {
      type: Boolean,
      default: false,
    },
    location: {
      type: Object,
      required: true,
      validator: createLocationValidator(true),
    },
    selectable: {
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
    rootLocationDisabled: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      pagination: {
        rowsPerPage: 10,
        page: 1,
      },
      internalRefreshCounter: 0,
      rows: [],
      rowsLoading: false,
      selected: [],
    };
  },

  computed: {
    loading() {
      return this.rowsLoading;
    },
    totalItems() {
      return Object.values(this.counts).reduce(
        (total, value) => total + value,
        0,
      );
    },
    internalSelectable() {
      return this.selectable && this.location && !isRootLocation(this.location);
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
        // Prevents databrowser from bouncing between directories.
        // this.rows = [];
        const counts = {
          nFolders: 0,
          nItems: 0,
          nUsers: 0,
          nCollections: 0,
        };
        const type = getLocationType(this.location);
        const { _id } = this.location;
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
        return [this.internalRefreshCounter, this.location, this.girderRest.user];
      },
    },
  },

  watch: {
    location(location) {
      if (createLocationValidator(!this.rootLocationDisabled)(location)) {
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
    if (!createLocationValidator(!this.rootLocationDisabled)(this.location)) {
      throw new Error('root location cannot be used when root-location-disabled is true');
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
    rowClick(row) {
      // Emit a row click regardless of type
      this.$emit('rowclick', row, this.location);
      // If the row is not an item, call changeLocation
      if (getLocationType(row) !== 'item') {
        this.changeLocation(row);
      }
    },
    changeLocation(newLocation) {
      const { location: oldLocation } = this;
      const newType = getLocationType(newLocation);
      const oldType = getLocationType(oldLocation);
      if (oldLocation._id !== newLocation._id || oldType !== newType) {
        this.$emit('update:location', newLocation);
      }
    },
    refresh() {
      this.internalRefreshCounter += 1;
    },
    fetchPaginatedRows() {
      const { location, counts } = this;
      if (counts.nFolders || counts.nItems) {
        return this.fetchPaginatedFolderRows();
      }
      const locationType = getLocationType(location);
      if (locationType === 'users' || locationType === 'collections') {
        if (counts.nUsers || counts.nCollections) {
          const singularType = getSingularLocationTypeName(location);
          return this.fetchPaginatedCollectionOrUserRows(singularType);
        }
      } else if (locationType === 'root') {
        return this.generateRootRows();
      }
      return [];
    },
    async fetchPaginatedFolderRows() {
      this.rowsLoading = true;
      const { counts, location, pagination } = this;
      // if needed, get folder public info
      let folderNotPublic = false;
      if (!location.created && location._modelType === 'folder') {
        folderNotPublic = !(await this.girderRest.get(`folder/${location._id}`)).data.public;
      }
      const { page, rowsPerPage } = pagination;
      const folderParams = {
        parentType: location._modelType,
        parentId: location._id,
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
        folderId: location._id,
        limit: rowsPerPage >= 0 ? itemLimit : null,
        offset: itemOffset > 0 ? itemOffset : 0,
      };
      const promises = [];
      promises.push(this.girderRest.get(GIRDER_FOLDER_ENDPOINT, { params: folderParams }));
      // a limit of < 0 signifies the current page only includes folders
      // a limit of null signifies no pagination: fetch all entities
      if (
        (itemParams.limit > 0 || itemParams.limit === null) &&
        location._modelType === 'folder'
      ) {
        promises.push(this.girderRest.get(GIRDER_ITEM_ENDPOINT, { params: itemParams }));
      }
      const responses = (await Promise.all(promises)).map(response => response.data);
      const rows = [].concat.apply(...responses).map(item => ({
        ...item,
        notPublic: item._modelType === 'folder' ? !item.public : folderNotPublic,
        size: item.size ? this.formatSize(item.size) : '',
        icon: this.getModelIcon(item),
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
      // Show "Users" if user is logged in
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
    getModelIcon(model) {
      switch (model._modelType) {
        case 'folder':
          if (model.public) {
            return 'folder';
          }
          return 'folderNonPublic';

        default:
          if (model._modelType in this.$vuetify.icons) {
            return model._modelType;
          }
          return 'file';
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
    :selectable="internalSelectable",
    @rowclick="rowClick",
    @row-right-click="$emit('row-right-click', arguments[0], arguments[1])",
    @drag="$emit('drag', $event)",
    @dragstart="$emit('dragstart', $event)",
    @dragend="$emit('dragend', $event)",
    @drop="$emit('drop', $event)")

  template(slot="header", slot-scope="props")
    tr.secondary.lighten-5
      th.pl-3.pr-0(width="1%", v-if="internalSelectable")
        v-checkbox.secondary--text.text--darken-1.pr-2(
            color="accent",
            hide-details,
            :input-value="props.all",
            :indeterminate="selected.length > 0 && !props.all",
            @click.native="toggleAll")
      th.pl-3(colspan="100", width="99%")
        v-layout(row)
          slot(name="breadcrumb", v-bind="{ location, changeLocation, rootLocationDisabled }")
          v-spacer
          slot(name="headerwidget", v-bind="{ location, changeLocation, rootLocationDisabled }")
</template>
