<script>
import { sizeFormatter } from '../utils/mixins';
import GirderDataTable from './Presentation/DataTable.vue';
import GirderBreadcrumb from './Breadcrumb.vue';

export default {
  components: {
    GirderBreadcrumb,
    GirderDataTable,
  },
  mixins: [sizeFormatter],
  inject: ['restClient'],
  props: {
    draggable: {
      type: Boolean,
      default: false,
    },
    folder: {
      type: Object,
      default: null,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Array,
      default: () => [],
    },
    initialItemsPerPage: {
      type: Number,
      default: 50,
    },
    itemsPerPageOptions: {
      type: Array,
      default: () => ([10, 25, 50, 100]),
    },
  },
  data() {
    return {
      breadcrumbs: [],
      options: {
        itemsPerPage: this.initialItemsPerPage,
        page: 1,
      },
      internalRefreshCounter: 0,
      rows: [],
      loading: false,
      lazyValue: this.value || [], // selected items
    };
  },
  computed: {
    serverItemsLength() {
      // TODO this needs to tell us how many items are on the server side, for pagination
      return this.rows.length;
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
    rows: {
      default: [],
      async get() {
        return this.fetchPaginatedRows();
      },
      watch() {
        return [this.internalRefreshCounter, this.folder, this.restClient.user];
      },
    },
  },
  watch: {
    folder() {
      // force reset options when location changes.
      this.options.page = 1;
      this.internalValue = [];
    },
    value(val) {
      this.lazyValue = val;
    },
    options() {
      this.internalRefreshCounter += 1;
    },
  },
  methods: {
    rowClick(row) {
      this.$emit('rowclick', row, this.folder);

      if (row.__type__ === 'folder') {
        this.navigateToChildFolder(row);
      }
    },
    navigateToChildFolder(folder) {
      this.breadcrumbs.push(folder);
      this.$emit('update:folder', folder);
    },
    refresh() {
      this.selected = [];
      this.internalRefreshCounter += 1;
    },
    breadcrumbClick({ index }) {
      this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
      this.$emit('update:folder', this.breadcrumbs[this.breadcrumbs.length - 1]);
    },
    async fetchPaginatedRows() {
      let folders = [];
      let files = [];
      if (this.folder) {
        // TODO pagination
        folders = (await this.restClient.get('/folders', {
          params: {
            parent: this.folder.id,
          },
        })).data.results;
        // TODO fetch files too, maybe only if folders doesn't fill the page
      } else {
        folders = (await this.restClient.get('/folders', {
          params: {
            parent: 'null',
          },
        })).data.results;
      }
      folders = folders.map((f) => ({
        ...f,
        __type__: 'folder',
        __icon__: 'folder',
      }));
      files = files.map((f) => ({
        ...f,
        __type__: 'file',
        __icon__: 'file',
      }));
      return [...folders, ...files];
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
    :selectable="selectable"
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
          :class="$vuetify.theme.dark ? 'darken-2':'lighten-5'"
          class="secondary"
        >
          <th
            v-if="selectable"
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
                v-bind="{ folder }"
                name="breadcrumb"
              >
                <girder-breadcrumb
                  @breadcrumb-click="breadcrumbClick"
                  :breadcrumbs="breadcrumbs"
                />
              </slot>
              <v-spacer />
              <slot
                v-bind="{ folder, navigateToChildFolder }"
                name="headerwidget"
              />
            </v-row>
          </th>
        </tr>
      </thead>
    </template><template #row-widget="props">
      <slot
        v-bind="props"
        name="row-widget"
      />
    </template>
  </girder-data-table>
</template>
