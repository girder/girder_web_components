<script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      default: null,
    },
  },
  computed: {
    listeners() {
      if (this.href) {
        return { click: () => { this.$vuetify.goTo(this.href); } };
      }
      return {};
    },
  },
};
</script>

<template lang="pug">
  v-list-item(:link="!!href", :href="href", v-on="listeners")
    v-list-item-content
      v-list-item-title {{ title }}
</template>
