<script>
import { computed } from 'vue';
import md from 'markdown-it';

export default {
  name: 'GirderMarkdown',
  props: {
    text: { default: '', type: String },
  },

  setup(props) {
    const markdown = computed(() => md({ linkify: true }).render(props.text));
    return {
      markdown,
    }
  },
};
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="g-md-viewer"
    v-html="markdown"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<style lang="scss">
.g-md-viewer ul {
  padding-left: 20px;
}
</style>
