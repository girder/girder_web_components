<script>
import GirderMarkdown from './Markdown.vue';

export default {
  components: { GirderMarkdown },
  model: {
    prop: 'text',
    event: 'changed',
  },
  props: {
    placeholder: {
      default: null,
      type: String,
    },
    text: {
      default: '',
      type: String,
    },
    label: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      activeTab: 0,
      text_: this.text,
    };
  },
  watch: {
    text() {
      this.text_ = this.text;
    },
    text_() {
      this.$emit('changed', this.text_);
    },
  },
};
</script>

<template>
  <div class="girder-markdown-editor">
    <v-tabs
      v-model="activeTab"
      class="md-tab"
    >
      <v-tab key="edit">
        Edit
      </v-tab>
      <v-tab-item>
        <v-textarea
          v-model="text_"
          :label="label"
          :placeholder="placeholder"
          hide-details="hide-details"
          filled="filled"
          single-line="single-line"
        />
      </v-tab-item>
      <v-tab key="preview">
        Preview
      </v-tab>
      <v-tab-item class="md-preview pa-2 grey lighten-3">
        <girder-markdown :text="text_" />
      </v-tab-item>
    </v-tabs>
    <v-toolbar
      dark="dark"
      color="secondary darken-2"
    >
      <span class="hidden-xs-only">
        Supports <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet">Markdown</a>
      </span>
      <v-spacer />
      <v-toolbar-items>
        <v-btn
          :class="{ active: activeTab === 0 }"
          text="text"
          @click="activeTab = 0"
        >
          <v-row
            class="flex-column align-center justify-content"
            no-gutters="no-gutters"
          >
            <v-icon class="mdi-24px">
              $vuetify.icons.edit
            </v-icon>
            <span class="caption text-capitalize">Write</span>
          </v-row>
        </v-btn>
        <v-btn
          :class="{ active: activeTab === 1 }"
          text="text"
          @click="activeTab = 1"
        >
          <v-row
            class="flex-column align-center justify-content"
            no-gutters="no-gutters"
          >
            <v-icon class="mdi-24px">
              $vuetify.icons.preview
            </v-icon>
            <span class="caption text-capitalize">Preview</span>
          </v-row>
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
  </div>
</template>

<style lang="scss">
.girder-markdown-editor {
  .v-tabs-bar {
    display: none;
  }

  .v-toolbar__content {
    padding-right: 0;
  }

  .v-toolbar__items .v-btn.active::after {
    content: " ";
    background-color: white;
    height: 3px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .md-preview {
    border-radius: 4px 4px 0 0;
    min-height: 116px;
  }

  a {
    text-decoration: none;
  }
}
</style>
