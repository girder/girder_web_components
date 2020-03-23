<script>
import { stringify } from 'qs';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderMarkdownEditor from './MarkdownEditor.vue';
import { createLocationValidator } from '../utils';

const GIRDER_FOLDER_ENDPOINT = 'folder';

export default {
  components: {
    GirderBreadcrumb,
    GirderMarkdownEditor,
  },
  props: {
    location: {
      type: Object,
      required: true,
      validator: createLocationValidator(false),
    },
    edit: {
      type: Boolean,
      default: false,
    },
    preUpsert: {
      type: Function,
      default: () => {},
    },
    postUpsert: {
      type: Function,
      default: () => {},
    },
  },
  inject: ['girderRest'],
  data() {
    return {
      name: '',
      description: '',
      error: '',
    };
  },
  computed: {
    append() {
      return this.edit ? [] : [this.name || 'New Folder'];
    },
  },
  mounted() {
    if (this.edit) {
      this.loadFolder(this.location._id);
    }
  },
  methods: {
    async upsert() {
      this.error = '';
      try {
        await this.preUpsert();
        if (this.edit) {
          await this.girderRest.put(
            `${GIRDER_FOLDER_ENDPOINT}/${this.location._id}`,
            stringify({
              name: this.name,
              description: this.description,
            }),
          );
        } else {
          await this.girderRest.post(
            GIRDER_FOLDER_ENDPOINT,
            stringify({
              parentType: this.location._modelType,
              parentId: this.location._id,
              name: this.name,
              description: this.description,
              reuseExisting: false,
            }),
          );
        }
        await this.postUpsert();
        this.name = '';
        this.description = '';
        this.$emit('done');
      } catch (error) {
        this.$emit('error', { type: 'upsert', error });
        this.setError(error);
      }
    },
    async loadFolder(id) {
      this.error = '';
      try {
        const { data } = await this.girderRest.get(`${GIRDER_FOLDER_ENDPOINT}/${id}`);
        this.name = data.name;
        this.description = data.description;
      } catch (error) {
        this.$emit('error', { type: 'load', error });
        this.setError(error);
      }
    },
    setError(err) {
      if (err.response) {
        const { data = {} } = err.response;
        const { type = 'unknown', message, field = 'unknown' } = data;
        this.error = `${type} error on ${field}: ${message || err.message}`;
      } else {
        this.error = `Unknown error: ${err.message}`;
      }
    },
  },
};
</script>

<template>
  <v-form @submit.prevent="upsert">
    <v-card flat="flat">
      <v-row
        class="pa-2 flex-column"
        no-gutters="no-gutters"
      >
        <slot name="header">
          <v-card-title
            class="pb-0"
            primary-title="primary-title"
          >
            <h5 class="display-1" />{{ edit ? 'Edit Folder' : 'Create New Folder' }}
          </v-card-title>
        </slot>
        <v-card-text>
          <v-text-field
            ref="folderName"
            v-model="name"
            autofocus="autofocus"
            label="Folder Name"
          />
          <girder-breadcrumb
            v-bind="{ location, append }"
            class="mb-3"
            readonly="readonly"
          />
          <girder-markdown-editor
            v-model="description"
            label="Description (Optional)"
          />
          <v-alert
            :value="!!error"
            type="error"
            dismissible="dismissible"
            transition="scale-transition"
          >
            {{ error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text="text"
            @click="$emit('dismiss')"
          >
            Cancel
          </v-btn>
          <v-btn
            :disabled="!name"
            depressed="depressed"
            color="primary"
            type="submit"
          >
            {{ edit ? 'Save Changes' : 'Create Folder' }}
          </v-btn>
        </v-card-actions>
      </v-row>
    </v-card>
  </v-form>
</template>
