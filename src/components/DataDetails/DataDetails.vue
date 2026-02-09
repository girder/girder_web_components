<script>
import { ref, computed, inject, watch } from 'vue';
import GirderDetailList from './DetailList.vue';
import GirderMarkdown from '../MarkdownEditor/Markdown.vue';
import GirderUpsertFolder from '../UpsertFolder.vue';
import { formatDate, formatSize, formatUsername, getResourceIcon, isRootLocation } from '@/utils';
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
    transform: formatSize,
  },
  {
    value: 'created',
    name: 'Created on ',
    transform: formatDate,
  },
  {
    value: 'updated',
    name: 'Updated on ',
    transform: formatDate,
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
 *  handler?: Function,
 *  generateHref?: Function,
 * }>}
 */
export const DefaultActionKeys = [
  {
    for: ['item'],
    name: 'View Item',
    iconKey: '$view',
    color: 'primary',
    generateHref(apiRoot, items) {
      const url = generateUrl(apiRoot, items[0]._modelType, items[0]._id, '?contentDisposition=inline');
      return url;
    },
    target: '_blank',
  },
  {
    for: ['item'],
    name: 'Download',
    iconKey: '$download',
    color: 'secondary',
    generateHref(apiRoot, items) {
      return generateUrl(apiRoot, items[0]._modelType, items[0]._id);
    },
    target: '_blank',
  },
  {
    for: ['folder', 'multi'],
    name: 'Download (zip)',
    iconKey: '$download',
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
    iconKey: '$delete',
    color: 'error',
    async handler({ items, girderRest }) {
      const lists = { item: [], folder: [] }
      items.forEach(item => {
        lists[item._modelType].push(item._id)
      })
      await girderRest.delete('resource', {
        params: {
          resources: JSON.stringify(lists),
          progress: true,
        },
      })
    },
  },
];

export default {
  name: "GirderDataDetails",

  components: {
    GirderDetailList,
    GirderMarkdown,
    GirderUpsertFolder,
  },

  props: {
    value: { required: true, type: Array },
    infoKeys: { type: Array, default: () => DefaultInfoKeys },
    actionKeys: { type: Array, default: () => DefaultActionKeys },
    newFolderEnabled: { type: Boolean, default: false },
  },

  emits: ['action'],

  setup(props, ctx) {
    // ---- Injected client ----
    const { rest, user } = inject("girder");

    // ---- State ----
    const newFolderDialog = ref(false);
    const details = ref(null);
    const files = ref([]);

    // ---- Computed ----
    const title = computed(() => (
      details.value
        ? (details.value.name || formatUsername(details.value))
        : `${props.value.length} Selection(s)`
    ));

    const datum = computed(() => (
      props.value.length === 1 ? props.value[0] : undefined
    ));

    const icon = computed(() => (
      datum.value ? getResourceIcon(datum.value) : '$fileMultiple'
    ));

    const meta = computed(() => (
      (details.value && 'meta' in details.value)
        ? Object.entries(details.value.meta).map(([key, value]) => ({ key, value }))
        : []
    ));
    
    const shouldShowNewFolder = computed(() =>
      props.newFolderEnabled &&
      !isRootLocation(props.value) &&
      user && user.value
    );

    const info = computed(() => {
      if (details.value) {
        /* If this is a single datum */
        return props.infoKeys.map((k) => {
          let val = details.value[k.value];
          if (k.transform) {
            val = k.transform(val);
          }
          return `${k.name}${val}`;
        });
      } if (props.value.length > 1) {
        /* If this is a multi-selection */
        const reducer = (acc, curr) => {
          acc[curr._modelType] += 1;
          acc.size += curr.size;
          return acc;
        };
        const typeCounts = props.value.reduce(reducer, {
          item: 0,
          folder: 0,
          size: 0,
        });
        const countMessages = ['item', 'folder']
          .filter((k) => typeCounts[k] > 0)
          .map((k) => `${typeCounts[k]} ${k}(s) selected`);
        const sizeMessage = `Total size: ${formatSize(typeCounts.size)}`;
        return [...countMessages, sizeMessage];
      }
      return [];
    });
    const actions = computed(() => {
      if (props.value.length === 0) {
        return [];
      }
      const actionType = datum.value ? datum.value._modelType : 'multi';
      return props.actionKeys
        .filter((k) => k.for.includes(actionType))
        .map((a) => {
          if (a.generateHref) {
            a.href = a.generateHref(rest.apiRoot, props.value);
          }
          return a;
        });
    });
    
    // ---- Methods ----
    async function handleAction(action) {
      if (action.handler) {
        await action.handler({
          items: props.value,
          girderRest: rest,
        })
      }
      ctx.emit('action', action);
    }

    // ---- Watchers ----
    watch(
      () => datum.value,
      async (d) => {
        details.value = null;
        files.value = [];

        if (!d) { return; }

        if (d.created) {
          details.value = d;
        }
        else if (d._id && d._modelType) {
          try {
            const { data } = await rest.get(`${d._modelType}/${d._id}`);
            details.value = data;
          } catch {
            details.value = null;
          }
        }

        if (d._modelType === 'item') {
          try {
            const { data } = await rest.get(`item/${d._id}/files`);
            files.value = data.map(f => f.name);
          } catch {
            files.value = [];
          }
        }
      },
      { immediate: true }
    );

    return {
      actions,
      datum,
      details,
      files,
      icon,
      info,
      meta,
      newFolderDialog,
      shouldShowNewFolder,
      title,
      handleAction
    };
  },
};
</script>


<template>
  <v-card class="data-details">
    <v-card-item
      style="background-color: rgb(var(--v-theme-surface-light));"
    >
      <template #prepend>
        <v-icon
          class="pr-2 mdi-18px"
          :icon="icon"
        />
      </template>
      <template #title>
        {{ title }}
      </template>
      <template #append>
        <v-btn
          v-if="datum && shouldShowNewFolder"
          v-tooltip="{text: 'New folder', location: 'bottom'}"
          icon
          variant="text"
        >
          <v-icon
            color="primary"
            icon="$folderNew"
          />
          <v-dialog
            v-model="newFolderDialog"
            activator="parent"
            max-width="800px"
          >
            <girder-upsert-folder
              :key="datum._id"
              :edit="true"
              :location="datum"
              @dismiss="showUpsert = false"
            />
          </v-dialog>
        </v-btn>
      </template>
    </v-card-item>
    <div
      v-if="details && details.description"
      class="px-4 text-subtitle-1 font-weight-bold"
    >
      Description
    </div>
    <girder-markdown
      v-if="details && details.description"
      :text="details.description"
      class="mx-4 mt-2"
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
        <div class="d-flex justify-space-between align-center">
          <div class="text-body-2 font-weight-bold">
            {{ props.datum.key }}
          </div>
          <div class="text-body-2 font-weight-light">
            {{ props.datum.value }}
          </div>
        </div>
      </template>
    </girder-detail-list>
    <girder-detail-list
      v-if="files.length"
      :title="`Files (${files.length})`"
      :rows="files"
    />
    <girder-detail-list
      v-if="actions.length"
      clickable
      :rows="actions"
      no-dividers
      @click="handleAction"
    >
      <template #row="props">
        <v-btn
          :color="props.datum.color"
          :prepend-icon="props.datum.icon || props.datum.iconKey"
          block
          :text="props.datum.name"
        />
      </template>
    </girder-detail-list>
  </v-card>
</template>
