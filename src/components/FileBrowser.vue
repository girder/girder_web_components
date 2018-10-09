<script>
import { sizeFormatter } from '../utils/mixins';

const GIRDER_FOLDER_ENDPOINT = 'folder';
const GIRDER_ITEM_ENDOINT = 'item';
const ICON_MAP = {
  folder: 'folder',
  item: 'file',
};

export default {
  props: {
    // location should have properties `type`, `id`
    location: {
      type: Object,
      required: true,
    },
    refresh: {
      type: Number,
      default: 0,
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
  mixins: [sizeFormatter],
  inject: ['girderRest'],
  data() {
    return {
      rowsLoading: false,
      breadcrumbLoading: false,
      pagination: {
        rowsPerPage: 10,
        page: 1,
      },
      selected: [],
    };
  },
  asyncComputed: {
    breadcrumb: {
      default: { root: {}, path: [] },
      async get() {
        this.requireSession();
        this.breadcrumbLoading = true;
        const breadcrumb = { root: {}, path: [] };
        let { id, type } = this.location;
        while (type) {
          const { data } = (await this.girderRest.get(`${type}/${id}`));
          const entity = {
            name: data.type !== 'user' ? data.name : data.login,
            id: data._id,
            type: data._modelType,
            parentId: data.parentId,
            parentType: data.parentCollection,
          };
          if (entity.type === 'folder') {
            breadcrumb.path.unshift(entity);
            id = entity.parentId;
            type = entity.parentType;
          } else {
            breadcrumb.root = entity;
            break;
          }
        }
        this.breadcrumbLoading = false;
        return breadcrumb;
      },
    },
    counts: {
      default: { nFolders: 0, nItems: 0 },
      async get() {
        this.requireSession();
        const endpoint = `${this.location.type}/${this.location.id}/details`;
        const { data } = (await this.girderRest.get(endpoint));
        return {
          nFolders: data.nFolders ? data.nFolders : 0,
          nItems: data.nItems ? data.nItems : 0,
        };
      },
      watch() {
        return [
          this.pagination,
          this.location,
        ];
      },
    },
    rows: {
      default: [],
      async get() {
        this.requireSession();
        const request = async (gr, endpoint, params) => {
          if (params === null) return [];
          const resp = await gr.get(endpoint, { params });
          if (resp.status !== 200) return [];
          return resp.data;
        };
        this.rowsLoading = true;
        const rows = [
          ...(await request(this.girderRest, GIRDER_FOLDER_ENDPOINT, this.folderParams)),
          ...(await request(this.girderRest, GIRDER_ITEM_ENDOINT, this.itemParams)),
        ].map(item => ({
          name: item.name,
          type: item._modelType,
          id: item._id,
          size: item.size ? this.formatSize(item.size) : '',
          icon: item._modelType in ICON_MAP ? ICON_MAP[item._modelType] : 'file',
        }));
        this.rowsLoading = false;
        return rows;
      },
      watch() {
        return [
          this.folderParams,
          this.itemParams,
          this.counts,
          this.location,
          this.refresh,
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
      this.$emit('update:selected', newval);
    },
  },
  computed: {
    folderParams() {
      return {
        parentType: this.location.type,
        parentId: this.location.id,
        limit: this.pagination.rowsPerPage,
        offset: (this.pagination.page - 1) * this.pagination.rowsPerPage,
      };
    },
    itemParams() {
      const limit = this.counts.nFolders > this.folderParams.offset
        ? this.pagination.rowsPerPage - (this.counts.nFolders - this.folderParams.offset)
        : this.pagination.rowsPerPage;
      const offset = this.folderParams.offset > 0
        ? this.folderParams.offset - this.counts.nFolders
        : 0;
      if (limit <= 0 || (this.location.type !== 'folder')) {
        return null; // No items should be shown on the current page.
      }
      return { folderId: this.location.id, limit, offset };
    },
    loading() { return this.rowsLoading || this.breadcrumbLoading ? 'accent' : false; },
    login() { return this.girderRest.user ? this.girderRest.user.login : ''; },
    totalItems() { return this.counts.nFolders + this.counts.nItems; },
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
      if ((this.location.id !== id || this.location.type !== type)
          && type !== 'item') {
        this.$emit('update:location', { type, id, name });
      }
    },
    requireSession() {
      if (!this.login || !this.location) {
        throw new Error('File Browser expects an active session and a defined location.');
      }
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
    :loading="loading",
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
      th.pl-0(width="80%")
        v-breadcrumbs.pl-0
          v-icon.mdi-24px(slot="divider", color="accent") {{ $vuetify.icons.chevron }}
          v-breadcrumbs-item(@click.native="changeLocation(breadcrumb.root)")
            v-icon.mdi-24px(color="accent") {{ $vuetify.icons.globe }}
            | &nbsp; {{ login }}
          v-breadcrumbs-item(
              v-for="item in breadcrumb.path",
              :key="`${item.id}.crumb`",
              @click.native="changeLocation(item)") {{ item.name }}
      th.pr-0(width="1%")
        v-btn(flat,
            small,
            color="secondary darken-2",
            v-if="newFolderEnabled",
            @click="$emit('click:newfolder')")
          v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.folderNew }}
          | New Folder
      th.pl-0.pr-2(width="1%")
        v-btn(flat,
            small,
            color="secondary darken-2",
            v-if="newItemEnabled",
            @click="$emit('click:newitem')")
          v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.fileNew }}
          | New Item

  //- Table Row Slot
  template(slot="items", slot-scope="props")
    tr.itemRow(:active="props.selected",
        @click="props.selected = !props.selected",
        :key="props.index")
      td
        v-checkbox.secondary--text.text--darken-1.pr-2(
            :input-value="props.selected", accent, hide-details)
      td.pl-1
        span.text-container.secondary--text.text--darken-3(
            :class="{selectable: props.item.type !== 'item'}",
            @click.stop="changeLocation(props.item)")
          v-icon(:color="props.selected ? 'accent' : ''") {{ $vuetify.icons[props.item.icon] }}
          | &nbsp; {{ props.item.name }}
      td.text-xs-right.secondary--text.text--darken-3(colspan="2") {{ props.item.size }}
</template>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'

.girder-file-browser-component.elevation-1
  .selectable
    opacity .8
    &:hover
      opacity 1
      cursor pointer
  .v-table tr
    &.itemRow
      &[active], &:hover
        background: $light-blue.lighten-5 !important
    &.secondary
      border-color inherit !important
    .v-input--checkbox
      border-right 1.5px solid
      padding-bottom 4px
    .text-container i
      vertical-align bottom
</style>

<style lang="stylus">
.girder-file-browser-component
  ul.v-breadcrumbs
    li
      &:nth-child(2n)
        padding 0 4px
  .theme--light.v-icon
    color: inherit
</style>
