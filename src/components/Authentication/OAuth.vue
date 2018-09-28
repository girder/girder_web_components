<template lang="pug">
.oauth-widget(v-if="providers.length")
  v-container
    h4.ml-0 Or {{verb}} with OAuth
    a.no-decorate(v-for="provider in providers",
        :key="provider.id",
        :href="provider.url")
      v-btn(:dark="iconMap[provider.id].dark", :color="provider.id")
        v-icon.aligned {{ $vuetify.icons[iconMap[provider.id].icon] }}
        span &nbsp; {{ provider.name }}
</template>

<script>
const iconMap = {
  github: {
    dark: true,
    icon: 'github',
  },
  google: {
    dark: true,
    icon: 'google',
  },
  linkedin: {
    icon: 'linkedin',
    dark: true,
  },
  bitbucket: {
    icon: 'bitbucket',
    dark: false,
  },
  box: {
    icon: 'box_com',
    dark: true,
  },
  globus: {
    icon: 'globus',
    dark: true,
  },
};
export default {
  props: {
    verb: {
      type: String,
      default: 'sign in',
    },
    // Array of Object{id: String, name: String, url: String}
    providers: {
      type: Array,
      default: () => [],
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
.v-btn.google
  background-color #3367d6 !important

.v-btn.linkedin
  background-color #283e4a !important

.v-btn.box
  background-color #0071f7 !important

.v-btn.globus
  background-color #335a95 !important
</style>
