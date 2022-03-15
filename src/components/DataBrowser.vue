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
    value: {
      type: Array,
      default: () => [],
    },
    itemsPerPage: {
      type: Number,
      default: 10,
    },
    itemsPerPageOptions: {
      type: Array,
      default: () => ([10, 25, 50]),
    },
  },

  data() {
    return {
      options: {
        itemsPerPage: this.itemsPerPage,
        page: 1,
      },
      internalRefreshCounter: 0,
      rows: [],
      rowsLoading: false,
      lazyValue: this.value || [], // selected items
    };
  },

  computed: {
    loading() {
      return this.rowsLoading;
    },
    serverItemsLength() {
      return Object.values(this.counts).reduce(
        (total, value) => total + value,
        0,
      );
    },
    internalSelectable() {
      return this.selectable && this.location && !isRootLocation(this.location);
    },
    internalValue: {
      get() {
        return this.lazyValue;
      },
      set(val) {
        this.lazyValue = val;
        this.$emit('input', val);
      },
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
        } if (type === 'users' || type === 'collections') {
          const { data } = await this.girderRest.get(`${this.getResourceType(type)}/details`);
          return {
            ...counts,
            ...{
              [Object.keys(data)[0]]: Object.values(data)[0],
            },
          };
        } if (type === 'root') {
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
        // force reset options when location changes.
        this.options.page = 1;
        this.internalValue = [];
      }
    },
    value(val) {
      this.lazyValue = val;
    },
    async counts() {
      this.rows = await this.fetchPaginatedRows();
    },
    // Not triggered by location options reset because deep==false
    async options() {
      this.rows = await this.fetchPaginatedRows();
    },
    // eslint-disable-next-line func-names
    'options.itemsPerPage': function (val) {
      this.$emit('update:itemsPerPage', val);
    },
  },

  created() {
    if (!createLocationValidator(!this.rootLocationDisabled)(this.location)) {
      throw new Error('root location cannot be used when root-location-disabled is true');
    }
  },

  methods: {
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
      this.selected = [];
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
      const { counts: { nFolders, nItems }, location, options: { page, itemsPerPage } } = this;
      // if needed, get folder public info
      let folderNotPublic = false;
      if (!location.created && location._modelType === 'folder') {
        folderNotPublic = !(await this.girderRest.get(`folder/${location._id}`)).data.public;
      }
      const promises = [];
      const folderOffset = itemsPerPage === -1 ? 0 : ((page - 1) * itemsPerPage);
      const numberOfFoldersCouldBeFetched = Math.max(nFolders - folderOffset, 0);
      if (numberOfFoldersCouldBeFetched !== 0) {
        const folderParams = {
          parentType: location._modelType,
          parentId: location._id,
          limit: itemsPerPage === -1 ? 0 : itemsPerPage,
          offset: folderOffset,
        };
        promises.push(this.girderRest.get(GIRDER_FOLDER_ENDPOINT, { params: folderParams }));
      }
      const itemOffset = Math.max(folderOffset - nFolders, 0);
      const numbersOfItemsCouldBeFetched = Math.max(nItems - itemOffset, 0);
      if (
        // there are items remaining
        numbersOfItemsCouldBeFetched > 0
        // and still have place for items
        && (itemsPerPage === -1 || itemsPerPage - numberOfFoldersCouldBeFetched > 0)
      ) {
        const itemParams = {
          folderId: location._id,
          limit: itemsPerPage === -1 ? 0 : itemsPerPage - numberOfFoldersCouldBeFetched,
          offset: itemOffset,
        };
        promises.push(this.girderRest.get(GIRDER_ITEM_ENDPOINT, { params: itemParams }));
      }
      const responses = (await Promise.all(promises)).map((response) => response.data);
      const rows = [].concat.apply(...responses).map((item) => ({
        ...item,
        humanSize: item.size ? this.formatSize(item.size) : '',
        icon: this.getModelIcon(item),
        notPublic: item._modelType === 'folder' ? !item.public : folderNotPublic,
      }));
      this.rowsLoading = false;
      return rows;
    },
    async fetchPaginatedCollectionOrUserRows(type) {
      this.rowsLoading = true;
      const { page, itemsPerPage } = this.options;
      const { data: items } = await this.girderRest.get(type, {
        params: {
          limit: itemsPerPage >= 0 ? itemsPerPage : null,
          offset: (page - 1) * itemsPerPage,
        },
      });
      const rows = items.map((item) => ({
        ...item,
        name:
          item._modelType === 'user'
            ? `${item.firstName} ${item.lastName}`
            : item.name,
        humanSize: item.size ? this.formatSize(item.size) : '',
        icon: item._modelType,
      }));
      this.rowsLoading = false;
      return rows;
    },
    generateRootRows() {
      const rows = [
        { type: 'collections', name: 'Collections', icon: 'collection' },
      ];
      // Show "Users" if user is logged in
      if (this.girderRest.user) {
        rows.push({ type: 'users', name: 'Users', icon: 'user' });
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
          if (model._modelType in this.$vuetify.icons.values) {
            return model._modelType;
          }
          return 'file';
      }
    },
  },
};
</script>

<template>
  <girder-data-table
    v-model="internalValue"
    :draggable="draggable"
    :rows="rows"
    :options.sync="options"
    :items-per-page-options="itemsPerPageOptions"
    :server-items-length="serverItemsLength"
    :loading="loading"
    :selectable="internalSelectable"
    class="girder-file-browser"
    @rowclick="rowClick"
    @row-right-click="$emit('row-right-click', arguments[0], arguments[1])"
    @drag="$emit('drag', $event)"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @drop="$emit('drop', $event)"
  >
    <template #header="{ props, on }">
      <thead>
        <tr
          :class="$vuetify.theme.dark?'darken-2':'lighten-5'"
          class="secondary"
        >
          <th
            v-if="internalSelectable"
            class="pl-3 pr-0"
            width="1%"
          >
            <v-checkbox
              :input-value="props.everyItem"
              :indeterminate="internalValue.length > 0 && !props.everyItem"
              class="pr-2"
              color="accent"
              hide-details="hide-details"
              @click.native="on['toggle-select-all'](!props.everyItem)"
            />
          </th>
          <th
            class="pl-3"
            colspan="10"
            width="99%"
          >
            <v-row class="ma-1">
              <slot
                v-bind="{ location, changeLocation, rootLocationDisabled }"
                name="breadcrumb"
              />
              <v-spacer />
              <slot
                v-bind="{ location, changeLocation, rootLocationDisabled }"
                name="headerwidget"
              />
            </v-row>
          </th>
        </tr>
      </thead>
    </template>
    <template #row="props">
      <slot
        v-bind="props"
        name="row"
      />
    </template>
  </girder-data-table>
</template>
