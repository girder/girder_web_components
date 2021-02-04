<script>
import GirderMarkdownEditor from './MarkdownEditor.vue';

export default {
  components: {
    GirderMarkdownEditor,
  },
  props: {
    folder: {
      type: Object,
      default: null,
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
      name: this.folder ? this.folder.name : '',
      description: this.folder ? this.folder.description : '',
      error: '',
      nameErrors: [],
    };
  },
  watch: {
    folder() {
      this.name = this.folder ? this.folder.name : '';
      this.description = this.folder ? this.folder.description : '';
    },
  },
  methods: {
    async upsert() {
      this.error = '';
      this.nameErrors = [];
      try {
        await this.preUpsert();
        let savedFolder;
        if (this.edit) {
          savedFolder = (await this.girderRest.put(`folders/${this.folder.id}`, {
            name: this.name,
            description: this.description,
          })).data;
        } else {
          savedFolder = (await this.girderRest.post('/folders', {
            parent: this.folder ? this.folder.id : null,
            name: this.name,
            description: this.description,
          })).data;
        }
        await this.postUpsert();
        this.name = '';
        this.description = '';
        this.$emit('done', savedFolder);
      } catch (error) {
        this.$emit('error', { type: 'upsert', error });
        this.setError(error);
      }
    },
    setError(err) {
      if (err.response) {
        const data = err.response.data;
        this.nameErrors = data.name || [];
        if (data.non_field_errors) {
          this.error = data.non_field_errors[0];
        }
      } else {
        this.error = 'An error occurred, please check the console for details.';
        console.error(err);
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
            v-model="name"
            autofocus="autofocus"
            label="Folder Name"
            :error-messages="nameErrors"
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
