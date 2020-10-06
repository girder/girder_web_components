<script>
import { sizeFormatter } from '../utils/mixins';
import GirderDataTable from './Presentation/DataTable.vue';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderUpload from './Upload.vue';
import GirderUpsertFolder from './UpsertFolder.vue';

export default {
  components: {
    GirderBreadcrumb,
    GirderDataTable,
    GirderUpload,
    GirderUpsertFolder,
  },
  mixins: [sizeFormatter],
  inject: ['girderRest'],
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
    initialBreadcrumbs: {
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
      breadcrumbs: this.initialBreadcrumbs,
      options: {
        itemsPerPage: this.initialItemsPerPage,
        page: 1,
      },
      internalRefreshCounter: 0,
      serverFoldersLength: -1,
      serverFilesLength: -1,
      rows: [],
      loading: false,
      newFolderDialog: false,
      uploaderDialog: false,
      lazyValue: this.value || [], // selected items
    };
  },
  computed: {
    serverItemsLength() {
      return this.serverFoldersLength + this.serverFilesLength;
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
        return [this.internalRefreshCounter, this.folder, this.girderRest.user];
      },
    },
  },
  watch: {
    folder() {
      // force reset options when location changes.
      this.options.page = 1;
      this.internalValue = [];
      this.serverFoldersLength = -1;
      this.serverFilesLength = -1;
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
    navigateToParentFolder() {
      this.breadcrumbClick({ index: this.breadcrumbs.length - 2 });
    },
    refresh() {
      this.internalValue = [];
      this.internalRefreshCounter += 1;
    },
    uploadDone() {
      this.uploaderDialog = false;
      this.serverFilesLength = -1;
      this.refresh();
    },
    breadcrumbClick({ index }) {
      this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
      this.$emit('update:folder', this.breadcrumbs[this.breadcrumbs.length - 1]);
    },
    newFolderCreated() {
      this.internalRefreshCounter += 1;
      this.serverFoldersLength = -1;
      this.newFolderDialog = false;
    },
    async fetchPaginatedRows() {
      this.loading = true;
      let folders = [];
      let files = [];
      const { itemsPerPage, page } = this.options;

      if (this.folder) {
        const folderOffset = (page - 1) * itemsPerPage;
        if (this.serverFoldersLength === -1 || folderOffset < this.serverFoldersLength - 1) {
          const { results: folderResults, count: folderCount } = (await this.girderRest.get('/folders', {
            params: {
              parent: this.folder.id,
              limit: itemsPerPage,
              offset: folderOffset,
            },
          })).data;
          folders = folderResults;
          this.serverFoldersLength = folderCount;
        }

        if (this.serverFilesLength === -1 || folders.length < itemsPerPage) {
          const numFolderPages = Math.ceil(this.serverFoldersLength / itemsPerPage);
          const numFilePages = Math.max(0, page - 1 - numFolderPages);
          const numFilesOnFirstPage = (numFolderPages * itemsPerPage) - this.serverFoldersLength;
          const fileOffset = page === numFolderPages ? 0 : numFilePages * itemsPerPage + numFilesOnFirstPage;
          const { results: fileResults, count: fileCount } = (await this.girderRest.get('/files', {
            params: {
              folder: this.folder.id,
              limit: Math.max(1, itemsPerPage - folders.length),
              offset: fileOffset,
            },
          })).data;
          if (folders.length < itemsPerPage) {
            files = fileResults;
          }
          this.serverFilesLength = fileCount;
        }
      } else {
        const { results, count } = (await this.girderRest.get('/folders', {
          params: {
            parent: 'null',
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
          },
        })).data;
        this.serverFilesLength = 0;
        this.serverFoldersLength = count;
        folders = results;
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

      this.loading = false;
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
                v-bind="{ folder }"
                name="headerwidget"
              >
                <v-dialog
                  v-if="!!folder"
                  v-model="uploaderDialog"
                  max-width="800px"
                >
                  <template #activator="{ on }">
                    <v-btn
                      class="ma-0"
                      text="text"
                      small="small"
                      v-on="on"
                    >
                      <v-icon
                        class="mdi-24px mr-1"
                        left="left"
                        color="accent"
                      >
                        $vuetify.icons.fileNew
                      </v-icon>
                      <span class="hidden-xs-only">Upload</span>
                    </v-btn>
                  </template>
                  <girder-upload
                    :dest="folder"
                    :post-upload="uploadDone"
                    :max-show="100"
                  />
                </v-dialog>
                <v-dialog
                  v-model="newFolderDialog"
                  max-width="800px"
                >
                  <template #activator="{ on }">
                    <v-btn
                      class="ma-0"
                      text="text"
                      small="small"
                      v-on="on"
                    >
                      <v-icon
                        class="mdi-24px mr-1"
                        left="left"
                        color="accent"
                      >
                        $vuetify.icons.folderNew
                      </v-icon>
                      <span class="hidden-xs-only">New Folder</span>
                    </v-btn>
                  </template>
                  <girder-upsert-folder
                    :folder="folder"
                    @dismiss="newFolderDialog = false"
                    @done="newFolderCreated"
                  />
                </v-dialog>
              </slot>
            </v-row>
          </th>
        </tr>
      </thead>
    </template>
    <template #row-widget="props">
      <slot
        v-bind="props"
        name="row-widget"
      />
    </template>
  </girder-data-table>
</template>
