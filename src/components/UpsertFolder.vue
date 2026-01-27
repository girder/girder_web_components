<script>
import { stringify } from 'qs';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderMarkdownEditor from './MarkdownEditor';
import { createLocationValidator } from '@/utils';
import { computed, inject, onMounted, ref } from 'vue';

const GIRDER_FOLDER_ENDPOINT = 'folder';

export default {
  name: 'GirderUpsertFolder',

  components: {
    GirderBreadcrumb,
    GirderMarkdownEditor,
  },

  props: {
    location: { type: Object, required: true, validator: createLocationValidator(false) },
    edit: { type: Boolean, default: false },
    preUpsert: { type: Function, default: () => {} },
    postUpsert: { type: Function, default: () => {} },
  },

  emits: ['dismiss', 'done', 'error'],

  setup(props, ctx) {
    // ---- Injected client ----
    const { rest } = inject('girder');

    // ---- State ----
    const folderName = ref('');
    const folderDescription = ref('');
    const error = ref(null);

    // ---- Computed ----
    const append = computed(() => props.edit ? [] : [{name: folderName.value || 'New Folder', type: 'folder'}]);
    
    // ---- Methods ----
    async function upsert() {
      const { edit, location, preUpsert, postUpsert } = props;
      error.value = null;
      try {
        await preUpsert();
        if (edit) {
          await rest.put(
            `${GIRDER_FOLDER_ENDPOINT}/${location._id}`,
            stringify({
              name: folderName.value,
              description: folderDescription.value,
            }),
          );
        } else {
          await rest.post(
            GIRDER_FOLDER_ENDPOINT,
            stringify({
              parentType: location._modelType,
              parentId: location._id,
              name: folderName.value,
              description: folderDescription.value,
              reuseExisting: false,
            }),
          );
        }
        await postUpsert();
        folderName.value = '';
        folderDescription.value = '';
        ctx.emit('done');
      } catch (upsertError) {
        ctx.emit('error', { type: 'upsert', upsertError });
        setError(upsertError);
      }
    }

    async function loadFolder(id) {
      error.value = null;
      try {
        const { data } = await rest.get(`${GIRDER_FOLDER_ENDPOINT}/${id}`);
        folderName.value = data.name;
        folderDescription.value = data.description;
      } catch (loadFolderError) {
        ctx.emit('error', { type: 'load', loadFolderError });
        setError(loadFolderError);
      }
    }

    function setError(err) {
      if (err.response) {
        const { data = {} } = err.response;
        const { type = 'unknown', message, field = 'unknown' } = data;
        error.value = `${type} error on ${field}: ${message || err.message}`;
      } else {
        error.value = `Unknown error: ${err.message}`;
      }
    }

    // ---- LifeCycle ----
    onMounted(() => {
      if (props.edit) {
        loadFolder(props.location._id);
      }
    });

    return {
      append,
      folderName,
      folderDescription,
      error,
      upsert,
    };
  },
};
</script>

<template>
  <v-form @submit.prevent="upsert">
    <v-card class="upsert-folder">
      <v-card-item :title="edit ? 'Edit Folder' : 'Create New Folder'">
        <v-card-subtitle>
          <girder-breadcrumb
            v-bind="{ location, append }"
            class="mb-3"
            readonly="readonly"
          />
        </v-card-subtitle>
      </v-card-item>
        
      <v-card-text>
        <v-text-field
          v-model="folderName"
          label="Folder Name"
          variant="solo-filled"
          flat
        />
        <girder-markdown-editor
          v-model="folderDescription"
          label="Description (Optional)"
        />
        <v-alert
          v-if="!!error"
          type="error"
          dismissible="dismissible"
          transition="scale-transition"
          title="Error"
          :text="error"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text="Cancel"
          @click="$emit('dismiss')"
        />
        <v-btn
          :disabled="!folderName"
          color="primary"
          :text="edit ? 'Save Changes' : 'Create Folder'"
          type="submit"
        />
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<style scoped lang="scss">
.upsert-folder {
  :deep(.v-card-item) {
    background-color: rgb(var(--v-theme-surface-light));
  }

  :deep(.v-card-text) {
    padding: 16px;
  }
}
</style>