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

<template lang="pug">
.girder-markdown-editor

  v-tabs.md-tab(v-model="activeTab")

    v-tab(key="edit") Edit
    v-tab-item
      v-textarea(
          hide-details,
          v-model="text_",
          filled,
          single-line,
          :label="label",
          :placeholder="placeholder")

    v-tab(key="preview") Preview
    v-tab-item.md-preview.pa-2.grey.lighten-3
      girder-markdown(:text="text_")

  v-toolbar(dark, color="secondary darken-2")
    span.hidden-xs-only Supports
      a(href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet")  Markdown
    v-spacer
    v-toolbar-items
      v-btn(text, @click="activeTab = 0", :class="{ active: activeTab === 0 }")
        v-layout(align-center, justify-content, column)
          v-icon.mdi-24px $vuetify.icons.edit
          span.caption.text-capitalize Write
      v-btn(text, @click="activeTab = 1", :class="{ active: activeTab === 1 }")
        v-layout(align-center, justify-content, column)
          v-icon.mdi-24px $vuetify.icons.preview
          span.caption.text-capitalize Preview
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
