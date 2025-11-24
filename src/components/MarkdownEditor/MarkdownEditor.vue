<script>
import { ref, watch } from 'vue';
import GirderMarkdown from './Markdown.vue';

export default {
  name: 'GirderMarkdownEditor',

  components: { GirderMarkdown },

  props: {
    placeholder: { default: null, type: String },
    text: { default: '', type: String },
    label: { type: String, default: '' },
  },

  emits: ['changed'],

  setup(props) {
    const activeTab = ref('edit');
    const internalText = ref(props.text);

    watch(
      () => props.text,
      (val) => {
        internalText.value = val;
      },
    );

    return {
      activeTab,
      internalText,
    };
  },
};
</script>

<template>
  <div class="girder-markdown-editor">
    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item value="edit">
        <v-textarea
          v-model="internalText"
          :label="label"
          :placeholder="placeholder"
          hide-details="hide-details"
          filled="filled"
          single-line="single-line"
          @change="$emit('changed', $event)"
        />
      </v-tabs-window-item>
      <v-tabs-window-item
        value="preview"
        class="md-preview"
      >
        <girder-markdown :text="internalText" />
      </v-tabs-window-item>
    </v-tabs-window>
    <v-toolbar>
      <span class="hidden-xs-only">
        Supports <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet">Markdown</a>
      </span>
      <v-spacer />
      <v-btn-toggle
        v-model="activeTab"
        mandatory
      >
        <v-btn
          v-tooltip="'Write'"
          value="edit"
          icon="$edit"
          variant="text"
        />
        <v-btn
          v-tooltip="'Preview'"
          value="preview"
          icon="$preview"
          variant="text"
        />
      </v-btn-toggle>
    </v-toolbar>
  </div>
</template>

<style lang="scss">
.girder-markdown-editor {
  .v-toolbar__content {
    padding: 12px;
    align-items: center;
  }

  .md-preview {
    padding: 16px;
    min-height: 152px;
    background-color: rgb(var(--v-theme-on-surface) / 0.04);
  }

  a {
    text-decoration: none;
  }
}
</style>
