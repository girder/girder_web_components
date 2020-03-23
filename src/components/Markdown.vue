<script>
import md from 'markdown-it';

export default {
  props: {
    text: {
      default: '',
      type: String,
    },
  },
  computed: {
    markdown() {
      return md({
        linkify: true,
      }).render(this.text);
    },
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
