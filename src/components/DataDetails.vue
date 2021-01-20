<script>
import GirderDetailList from './Presentation/DetailList.vue';
import GirderMarkdown from './Markdown.vue';
import GirderUpsertFolder from './UpsertFolder.vue';
import { dateFormatter, sizeFormatter } from '../utils/mixins';

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
    value: 'modified',
    name: 'Last modified ',
    transform: dateFormatter.methods.formatDate,
  },
  {
    value: 'id',
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
    for: ['file'],
    id: 'view',
    name: 'View File',
    iconKey: 'view',
    color: 'primary',
    generateHref: (apiRoot, [file]) => `${apiRoot}/files/${file.id}/download?contentDisposition=inline`,
    target: '_blank',
  },
  {
    for: ['file'],
    id: 'download',
    name: 'Download',
    iconKey: 'download',
    color: 'secondary',
    generateHref: (apiRoot, [file]) => `${apiRoot}/files/${file.id}/download`,
    target: '_blank',
  },
  {
    for: ['folder'],
    id: 'permissions',
    name: 'Permissions',
    iconKey: 'lock',
    color: 'warning',
    condition: ([folder]) => !folder.parent && folder.access.admin,
  },
  {
    for: ['file', 'folder'/* , TODO batch delete 'multi' */],
    id: 'delete',
    name: 'Delete',
    iconKey: 'delete',
    color: 'error',
    async handler() {
      // TODO we should really prompt the user for confirmation...
      const [item] = this.value; // just handles 1 item for now
      await this.girderRest.delete(`${item.__type__}s/${item.id}`);
    },
  },
];

export default {
  components: {
    GirderDetailList,
    GirderMarkdown,
    GirderUpsertFolder,
  },
  mixins: [sizeFormatter],
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
    details() {
      // TODO may be necessary later if list and details endpoints return different fields
      return this.datum;
    },
  },
  computed: {
    title() {
      return this.details
        ? this.details.name
        : `${this.value.length} Selection(s)`;
    },
    datum() {
      return this.value.length === 1 ? this.value[0] : undefined;
    },
    icon() {
      return this.datum
        ? this.$vuetify.icons.values[this.datum.__type__]
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
        return this.infoKeys.filter((k) => k.value in this.details).map((k) => {
          let val = this.details[k.value];
          if (k.transform) {
            val = k.transform(val);
          }
          return `${k.name}${val}`;
        });
      }/* if (this.value.length > 1) {
        const reducer = (acc, curr) => {
          acc[curr.__type__] += 1;
          acc.size += curr.size;
          return acc;
        };
        const typeCounts = this.value.reduce(reducer, {
          item: 0,
          folder: 0,
          size: 0,
        });
        const countMessages = ['file', 'folder']
          .filter((k) => typeCounts[k] > 0)
          .map((k) => `${typeCounts[k]} ${k}(s) selected`);
        const sizeMessage = `Total size: ${this.formatSize(typeCounts.size)}`;
        return [...countMessages, sizeMessage];
      } */
      return [];
    },
    actions() {
      if (this.value.length === 0) {
        return [];
      }
      const actionType = this.datum ? this.datum.__type__ : 'multi';
      return this.actionKeys
        .filter((k) => k.for.includes(actionType) && (!k.condition || k.condition(this.value)))
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
