<template lang="pug">
v-card.data-details
  v-toolbar(flat, dark, dense, color="primary")
    v-toolbar-title.subtitle-1
      v-icon.pr-2.mdi-18px {{ icon }}
      | {{ title }}
    v-spacer
    v-dialog(v-if="datum", v-model="showUpsert", max-width="800px")
      template(v-slot:activator="{ on }")
        v-btn(v-on="on", icon)
          v-icon.mdi-18px {{ $vuetify.icons.edit }}
      girder-upsert-folder(
          :edit="true",
          :key="datum._id",
          :location="datum",
          @dismiss="showUpsert = false")
  girder-markdown.mx-3.mt-2(v-if="details && details.description", :text="details.description")
  girder-detail-list(title="Info", :rows="info")
  girder-detail-list(v-if="meta.length", title="Meta", :rows="meta")
    template(#row="props")
      v-row(justify="space-between")
        v-col.shrink.py-1.body-2.font-weight-bold {{ props.datum.key }}
        v-col.py-1.body-2.d-flex.justify-end {{ props.datum.value }}
  girder-detail-list(
      v-if="files.length",
      :title="`Files (${files.length})`",
      :rows="files")
  girder-detail-list(
      v-if="actions.length",
      title="Actions",
      :clickable="true",
      :rows="actions",
      @click="handleAction")
    template(#row="props")
      v-list-item-icon.mr-1
        v-icon.pr-2(:color="props.datum.color")
          | {{ props.datum.icon || $vuetify.icons.values[props.datum.iconKey] }}
      v-list-item-content(:class="`${props.datum.color}--text`") {{ props.datum.name }}
</template>

<script>
import GirderDetailList from './Presentation/DetailList.vue';
import GirderMarkdown from './Markdown.vue';
import GirderUpsertFolder from './UpsertFolder.vue';
import { dateFormatter, sizeFormatter, usernameFormatter } from '../utils/mixins';

function download(baseurl, modelType, id, query = '') {
  if (['resource', 'folder', 'item', 'file'].indexOf(modelType) < 0) {
    throw new Error(`${modelType} is not downloadable`);
  }
  const idpart = id ? `${id}/` : '';
  const url = `${baseurl}/${modelType}/${idpart}download${query}`;
  window.open(url, '_blank');
}

/**
 * @type {Array<{
 *  value: String,
 *  name: String,
 *  transform: Function
 * }>}
 */
export const DefaultInfoKeys = [
  {
    value: 'size',
    name: 'Size: ',
    transform: sizeFormatter.methods.formatSize,
  },
  {
    value: 'created',
    name: 'Created on ',
    transform: dateFormatter.methods.formatDate,
  },
  {
    value: 'updated',
    name: 'Updated on ',
    transform: dateFormatter.methods.formatDate,
  },
  {
    value: '_id',
    name: 'Unique ID: ',
  },
];

/**
 * @type {Array<{
 *  for: Array<String>,
 *  name: String,
 *  icon: String,
 *  color: String,
 *  handler: Function,
 * }>}
 */
export const DefaultActionKeys = [
  {
    for: ['item'],
    name: 'View Item',
    iconKey: 'view',
    color: 'primary',
    handler() {
      const { value: items } = this;
      download(this.girderRest.apiRoot, items[0]._modelType, items[0]._id, '?contentDisposition=inline');
    },
  },
  {
    for: ['item'],
    name: 'Download',
    iconKey: 'download',
    color: 'secondary',
    handler() {
      const { value: items } = this;
      download(this.girderRest.apiRoot, items[0]._modelType, items[0]._id);
    },
  },
  {
    for: ['folder', 'multi'],
    name: 'Download (zip)',
    iconKey: 'download',
    color: 'secondary',
    handler() {
      const { value: items } = this;
      const lists = { item: [], folder: [] };
      items.forEach(item => lists[item._modelType].push(item._id));
      download(this.girderRest.apiRoot, 'resource', null, `?resources=${JSON.stringify(lists)}`);
    },
  },
  {
    for: ['item', 'folder', 'multi'],
    name: 'Delete',
    iconKey: 'delete',
    color: 'error',
    async handler() {
      const { value: items } = this;
      const lists = { item: [], folder: [] };
      items.forEach(item => lists[item._modelType].push(item._id));
      await this.girderRest.delete('resource', {
        params: { resources: JSON.stringify(lists) },
      });
    },
  },
];

export default {
  components: {
    GirderDetailList,
    GirderMarkdown,
    GirderUpsertFolder,
  },
  mixins: [sizeFormatter, usernameFormatter],
  props: {
    value: {
      required: true,
      type: Array,
    },
    infoKeys: {
      type: Array,
      default: () => DefaultInfoKeys,
    },
    actionKeys: {
      type: Array,
      default: () => DefaultActionKeys,
    },
  },
  data() {
    return {
      showUpsert: false,
    };
  },
  inject: ['girderRest'],
  asyncComputed: {
    async details() {
      if (this.datum && this.datum.created) {
        return this.datum;
      } else if (this.datum && this.datum._id && this.datum._modelType) {
        const { data } = await this.girderRest.get(`${this.datum._modelType}/${this.datum._id}`);
        return data;
      }
      return null;
    },
    files: {
      default: [],
      async get() {
        if (this.datum && this.datum._modelType === 'item') {
          const { data } = await this.girderRest.get(`item/${this.datum._id}/files`);
          return data.map(f => f.name);
        }
        return [];
      },
    },
  },
  computed: {
    title() {
      return this.details
        ? (this.details.name || this.formatUsername(this.details))
        : `${this.value.length} Selection(s)`;
    },
    datum() {
      return this.value.length === 1 ? this.value[0] : undefined;
    },
    icon() {
      return this.datum
        ? this.$vuetify.icons.values[this.datum._modelType]
        : this.$vuetify.icons.values.fileMultiple;
    },
    meta() {
      if (this.details && 'meta' in this.details) {
        return Object.entries(this.details.meta)
          .map(([key, value]) => ({ key, value }));
      }
      return [];
    },
    info() {
      if (this.details) {
        /* If this is a single datum */
        return this.infoKeys.map((k) => {
          let val = this.details[k.value];
          if (k.transform) {
            val = k.transform(val);
          }
          return `${k.name}${val}`;
        });
      } else if (this.value.length > 1) {
        /* If this is a multi-selection */
        const reducer = (acc, curr) => {
          acc[curr._modelType] += 1;
          acc.size += curr.size;
          return acc;
        };
        const typeCounts = this.value.reduce(reducer, {
          item: 0,
          folder: 0,
          size: 0,
        });
        const countMessages = ['item', 'folder']
          .filter(k => typeCounts[k] > 0)
          .map(k => `${typeCounts[k]} ${k}(s) selected`);
        const sizeMessage = `Total size: ${this.formatSize(typeCounts.size)}`;
        return [...countMessages, sizeMessage];
      }
      return [];
    },
    actions() {
      const actionType = this.datum ? this.datum._modelType : 'multi';
      return this.actionKeys.filter(k => k.for.includes(actionType));
    },
  },
  methods: {
    async handleAction(action) {
      await action.handler.apply(this);
      this.$emit('action', action);
    },
  },
};
</script>
