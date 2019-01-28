<script>
import { stringify } from 'qs';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderMarkdownEditor from './MarkdownEditor.vue';

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
      validator: val => val._modelType && val._id,
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

<template lang="pug">
v-card(flat, height="100%")
  v-layout.pa-2(column, fill-height)
    slot(name="header")
      v-card-title.pb-0(primary-title)
        h5.display-1.secondary--text.text--darken-1 {{ edit ? 'Edit Folder' : 'Create New Folder'}}
    v-card-text
      v-flex(xs12)
        v-text-field(
            ref="folderName",
            v-model="name",
            autofocus,
            label="Folder Name")
      girder-breadcrumb.mb-3(
          :location="location",
          :disabled="true",
          :append="append")
      girder-markdown-editor(
          v-model="description",
          label="Description (Optional)")
      v-alert(
          type="error",
          :value="!!error",
          dismissible,
          transition="scale-transition") {{ error }}
    v-card-actions
      v-spacer
      v-btn(flat, @click="$emit('dismiss')") Cancel
      v-btn(
          depressed,
          color="primary",
          :disabled="!name",
          @click="upsert") {{ edit ? 'Save Changes' : 'Create Folder' }}
</template>
