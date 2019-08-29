<template lang="pug">
v-container.oauth-widget
  h4 Or {{ verb }} with OAuth
  v-btn.ml-0.mr-3(v-for="provider in providers",
      :key="provider.id",
      :dark="iconMap[provider.id].dark",
      :color="iconMap[provider.id].color",
      :href="provider.url")
    v-icon(left) {{ $vuetify.icons.values[iconMap[provider.id].icon] }}
    | {{ provider.name }}
</template>

<script>
const iconMap = {
  github: { dark: true, icon: 'github' },
  google: { dark: true, icon: 'google', color: '#3367d6' },
  linkedin: { dark: true, icon: 'linkedin', color: '#283e4a' },
  bitbucket: { dark: false, icon: 'bitbucket' },
  box: { dark: true, icon: 'box_com', color: '#0071f7' },
  globus: { dark: true, icon: 'globus', color: '#335a95' },
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
