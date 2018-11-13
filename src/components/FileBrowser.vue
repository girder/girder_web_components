<script>
import { sizeFormatter } from '../utils/mixins';
import GirderBreadcrumb from './Breadcrumb.vue';

const GIRDER_FOLDER_ENDPOINT = 'folder';
const GIRDER_ITEM_ENDOINT = 'item';
const ICON_MAP = {
  folder: 'folder',
  item: 'file',
};

export default {
  components: {
    GirderBreadcrumb,
  },
  mixins: [sizeFormatter],
  props: {
    location: {
      type: Object,
      required: true,
      validator: val => val.type && val.id,
    },
    selectEnabled: {
      type: Boolean,
      default: true,
    },
    multiSelectEnabled: {
      type: Boolean,
      default: false,
    },
    uploadEnabled: {
      type: Boolean,
      default: false,
    },
    newItemEnabled: {
      type: Boolean,
      default: true,
    },
    newFolderEnabled: {
      type: Boolean,
      default: true,
    },
  },
  inject: ['girderRest'],
  data() {
    return {
      breadcrumbLoading: false,
      pagination: {
        rowsPerPage: 10,
        page: 1,
      },
      refreshCounter_: 0,
      rows: [],
      rowsLoading: false,
      selected: [],
    };
  },
  computed: {
    loading() {
      return this.rowsLoading || this.breadcrumbLoading;
    },
    totalItems() {
      return this.counts.nFolders + this.counts.nItems;
    },
  },
  asyncComputed: {
    counts: {
      default: { nFolders: 0, nItems: 0 },
      async get() {
        const endpoint = `${this.location.type}/${this.location.id}/details`;
        const { data } = await this.girderRest.get(endpoint);
        return {
          nFolders: data.nFolders ? data.nFolders : 0,
          nItems: data.nItems ? data.nItems : 0,
        };
      },
      watch() {
        return [
          this.refreshCounter_,
          this.location,
        ];
      },
    },
  },
  watch: {
    location(newval, oldval) {
      // force reset pagination when location changes.
      if (newval.id !== oldval.id) {
        this.pagination.page = 1;
      }
    },
    selected(newval) {
      this.$emit('selection-changed', newval);
    },
    async counts() {
      this.rows = await this.fetchPaginatedRows();
    },
    async pagination() {
      this.rows = await this.fetchPaginatedRows();
    },
  },
  methods: {
    toggleAll() {
      if (this.selected.length === this.rows.length) {
        this.selected = [];
      } else {
        this.selected = this.rows.slice();
      }
    },
    changeLocation(item) {
      const { type, id, name } = item;
      if ((this.location.id !== id || this.location.type !== type) &&
          type !== 'item') {
        this.$emit('update:location', { type, id, name });
      }
    },
    refresh() {
      this.refreshCounter_ += 1;
    },
    async fetchPaginatedRows() {
      this.rowsLoading = true;
      const { counts, location, pagination } = this;
      const { page, rowsPerPage } = pagination;
      const folderParams = {
        parentType: location.type,
        parentId: location.id,
        limit: rowsPerPage,
        offset: (page - 1) * rowsPerPage,
      };
      const itemParams = {
        folderId: location.id,
        // If there are folders on the current page,
        // the numer of items to fetch will be less than rowsPerPage
        limit:
          counts.nFolders > folderParams.offset
            ? rowsPerPage - (counts.nFolders - folderParams.offset)
            : rowsPerPage,
        offset:
          folderParams.offset > 0 ? folderParams.offset - counts.nFolders : 0,
      };
      const promises = [];
      promises.push(this.girderRest.get(GIRDER_FOLDER_ENDPOINT, { params: folderParams }));
      if (itemParams.limit > 0 && location.type === 'folder') {
        promises.push(this.girderRest.get(GIRDER_ITEM_ENDOINT, { params: itemParams }));
      }
      const responses = (await Promise.all(promises)).map(response => response.data);
      const rows = [].concat.apply(...responses).map(item => ({
        name: item.name,
        type: item._modelType,
        id: item._id,
        size: item.size ? this.formatSize(item.size) : '',
        icon: item._modelType in ICON_MAP ? ICON_MAP[item._modelType] : 'file',
      }));
      this.rowsLoading = false;
      return rows;
    },
  },
};
</script>

<template lang="pug">
v-data-table.girder-file-browser-component.elevation-1(
    select-all,
    :headers-length="4",
    v-model="selected",
    :pagination.sync="pagination",
    :items="rows",
    :total-items="totalItems",
    :loading="loading ? 'accent' : false",
    item-key="id")

  //- Header Slot
  template(slot="headers", slot-scope="props")
    tr.secondary.lighten-5
      th(width="1%")
        v-checkbox.secondary--text.text--darken-1.pr-2(
            color="accent",
            hide-details,
            :input-value="props.all",
            :indeterminate="selected.length > 0 && !props.all",
            @click.native="toggleAll")
      th.pl-0
        girder-breadcrumb(
            :location="location",
            :loading.sync="breadcrumbLoading",
            @changelocation="changeLocation")
      th.pr-0.align-right(width="1%")
        v-btn(flat,
            small,
            color="secondary darken-2",
            v-if="newFolderEnabled",
            @click="$emit('click:newfolder')")
          v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.folderNew }}
          span(v-if="$vuetify.breakpoint.smAndUp") New Folder
      th.pl-0.pr-1.align-right(width="1%")
        v-btn(flat,
            small,
            color="secondary darken-2",
            v-if="newItemEnabled",
            @click="$emit('click:newitem')")
          v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.fileNew }}
          span(v-if="$vuetify.breakpoint.smAndUp") New Item

  //- Table Row Slot
  template(slot="items", slot-scope="props")
    tr.itemRow(:active="props.selected",
        @click="props.selected = !props.selected",
        :key="props.index")
      td
        v-checkbox.secondary--text.text--darken-1.pr-2(
            :input-value="props.selected", accent, hide-details)
      td.pl-1(colspan="2")
        span.text-container.secondary--text.text--darken-3.nobreak(
            :class="{selectable: props.item.type !== 'item'}",
            @click.stop="changeLocation(props.item)")
          v-icon(:color="props.selected ? 'accent' : ''") {{ $vuetify.icons[props.item.icon] }}
          span &nbsp; {{ props.item.name }}
      td.text-xs-right.secondary--text.text--darken-3.nobreak {{ props.item.size }}
</template>

<style lang="scss" scoped>
.girder-file-browser-component.elevation-1 {
  box-shadow: none !important;
  .selectable {
    opacity: 0.8;

    &:hover {
      opacity: 1;
      cursor: pointer;
    }
  }

  .v-table {
    th {
      button.v-btn {
        min-width: 0;
        margin: 0;
      }
    }

    tr {
      &.itemRow[active],
      &.itemRow:hover {
        // $light-blue.lighten-5
        background: #e1f5fe !important;
      }

      &.secondary {
        border-color: inherit !important;
      }

      .v-input--checkbox {
        border-right: 1.5px solid;
        padding-bottom: 4px;
      }

      .text-container i {
        vertical-align: bottom;
      }

      .nobreak {
        white-space: nowrap;
      }
    }
  }
}
</style>

<style lang="scss">
.girder-file-browser-component {
  .theme--light.v-icon {
    color: inherit;
  }

  .v-datatable__progress .v-progress-linear {
    position: absolute;
  }
}
</style>
