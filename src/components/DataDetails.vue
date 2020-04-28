<template>
  <v-card class="data-details">
    <v-toolbar
      flat="flat"
      dark="dark"
      dense="dense"
      color="primary"
    >
      <v-toolbar-title class="subtitle-1">
        <v-icon class="pr-2 mdi-18px">
          {{ icon }}
        </v-icon>{{ title }}
      </v-toolbar-title>
      <v-spacer />
      <v-dialog
        v-if="datum"
        v-model="showUpsert"
        max-width="800px"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            icon="icon"
            v-on="on"
          >
            <v-icon class="mdi-18px">
              {{ $vuetify.icons.edit }}
            </v-icon>
          </v-btn>
        </template>
        <girder-upsert-folder
          :key="datum._id"
          :edit="true"
          :location="datum"
          @dismiss="showUpsert = false"
        />
      </v-dialog>
    </v-toolbar>
    <girder-markdown
      v-if="details && details.description"
      :text="details.description"
      class="mx-3 mt-2"
    />
    <girder-detail-list
      :rows="info"
      title="Info"
    />
    <girder-detail-list
      v-if="meta.length"
      :rows="meta"
      title="Meta"
    >
      <template #row="props">
        <v-row justify="space-between">
          <v-col class="shrink py-1 body-2 font-weight-bold">
            {{ props.datum.key }}
          </v-col>
          <v-col class="py-1 body-2 d-flex justify-end">
            {{ props.datum.value }}
          </v-col>
        </v-row>
      </template>
    </girder-detail-list>
    <girder-detail-list
      v-if="files.length"
      :title="`Files (${files.length})`"
      :rows="files"
    />
    <girder-detail-list
      v-if="actions.length"
      :clickable="true"
      :rows="actions"
      title="Actions"
      @click="handleAction"
    >
      <template #row="props">
        <v-list-item-icon class="mr-1">
          <v-icon
            :color="props.datum.color"
            class="pr-2"
          >
            {{ props.datum.icon || $vuetify.icons.values[props.datum.iconKey] }}
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content :class="`${props.datum.color}--text`">
          {{ props.datum.name }}
        </v-list-item-content>
      </template>
    </girder-detail-list>
  </v-card>
</template>

<script>
import GirderDetailList from './Presentation/DetailList.vue';
import GirderMarkdown from './Markdown.vue';
import GirderUpsertFolder from './UpsertFolder.vue';
import { dateFormatter, sizeFormatter, usernameFormatter } from '../utils/mixins';

function generateUrl(apiRoot, modelType, id, query = '') {
  if (['resource', 'folder', 'item', 'file'].indexOf(modelType) < 0) {
    throw new Error(`${modelType} is not downloadable`);
  }
  const idpart = id ? `${id}/` : '';
  return `${apiRoot}/${modelType}/${idpart}download${query}`;
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
 *  target?: String,
 *  handler: Function,
 * }>}
 */
export const DefaultActionKeys = [
  {
    for: ['item'],
    name: 'View Item',
    iconKey: 'view',
    color: 'primary',
    generateHref(apiRoot, items) {
      return generateUrl(apiRoot, items[0]._modelType, items[0]._id, '?contentDisposition=inline');
    },
    target: '_blank',
  },
  {
    for: ['item'],
    name: 'Download',
    iconKey: 'download',
    color: 'secondary',
    generateHref(apiRoot, items) {
      return generateUrl(apiRoot, items[0]._modelType, items[0]._id);
    },
    target: '_blank',
  },
  {
    for: ['folder', 'multi'],
    name: 'Download (zip)',
    iconKey: 'download',
    color: 'secondary',
    generateHref(apiRoot, items) {
      const lists = { item: [], folder: [] };
      items.forEach((item) => lists[item._modelType].push(item._id));
      return generateUrl(apiRoot, 'resource', null, `?resources=${JSON.stringify(lists)}`);
    },
    target: '_blank',
  },
  {
    for: ['item', 'folder', 'multi'],
    name: 'Delete',
    iconKey: 'delete',
    color: 'error',
    async handler() {
      const { value: items } = this;
      const lists = { item: [], folder: [] };
      items.forEach((item) => lists[item._modelType].push(item._id));
      await this.girderRest.delete('resource', {
        params: { resources: JSON.stringify(lists), progress: true },
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
      } if (this.datum && this.datum._id && this.datum._modelType) {
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
          return data.map((f) => f.name);
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
      } if (this.value.length > 1) {
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
          .filter((k) => typeCounts[k] > 0)
          .map((k) => `${typeCounts[k]} ${k}(s) selected`);
        const sizeMessage = `Total size: ${this.formatSize(typeCounts.size)}`;
        return [...countMessages, sizeMessage];
      }
      return [];
    },
    actions() {
      if (this.value.length === 0) {
        return [];
      }
      const actionType = this.datum ? this.datum._modelType : 'multi';
      return this.actionKeys
        .filter((k) => k.for.includes(actionType))
        .map((a) => {
          if (a.generateHref) {
            a.href = a.generateHref(this.girderRest.apiRoot, this.value);
          }
          return a;
        });
    },
  },
  methods: {
    async handleAction(action) {
      if (action.handler) {
        await action.handler.apply(this);
      }
      this.$emit('action', action);
    },
  },
};
</script>
