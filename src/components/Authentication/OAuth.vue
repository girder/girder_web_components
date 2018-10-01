<template lang="pug">
v-container.oauth-widget
  h4 Or {{ verb }} with OAuth
  v-btn.ml-0.mr-3(v-for="provider in providers",
      :key="provider.id",
      :dark="iconMap[provider.id].dark",
      :color="provider.id",
      :href="provider.url")
    v-icon.aligned(left) {{ $vuetify.icons[iconMap[provider.id].icon] }}
    | {{ provider.name }}
</template>

<script>
const iconMap = {
  github: { dark: true, icon: 'github' },
  google: { dark: true, icon: 'google' },
  linkedin: { dark: true, icon: 'linkedin' },
  bitbucket: { dark: false, icon: 'bitbucket' },
  box: { dark: true, icon: 'box_com' },
  globus: { dark: true, icon: 'globus' },
};
export default {
  props: {
    verb: {
      type: String,
      default: 'sign in',
    },
    // Array of Object{ id: String, name: String, url: String }
    providers: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      enabledProviders: [],
      iconMap,
    };
  },
};
</script>

<style lang="stylus" scoped>
.v-btn
  &.google
    background-color #3367d6 !important
  &.linkedin
    background-color #283e4a !important
  &.box
    background-color #0071f7 !important
  &.globus
    background-color #335a95 !important
</style>
