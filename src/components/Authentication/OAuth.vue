<template lang="pug">
.oauth-widget(v-if='providers.length')
  //- v-divider
  v-container
    h4 Or {{verb}} with OAuth
    a(v-for='provider in providers' :key='provider.id' :href='provider.url' class='no-decorate')
      v-btn(:dark='iconMap[provider.id].dark' :color='provider.id')
        v-icon {{ iconName(provider.id) }}
        span &nbsp; {{ provider.name }}
</template>

<script>
const iconMap = {
  github: {
    dark: true,
    icon: 'fab fa-github',
  },
  google: {
    dark: true,
    icon: 'fab fa-google',
  },
  linkedin: {
    icon: 'fab fa-linkedin',
    dark: true,
  },
  bitbucket: {
    icon: 'fab fa-bitbucket',
    dark: false,
  },
  box: {
    icon: 'fas fa-archive',
    dark: true,
  },
  globus: {
    icon: 'fas fa-globe',
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
  methods: {
    iconName(providerId) {
      return `${iconMap[providerId].icon}`;
    },
  },
};
</script>

<style lang="stylus" scoped>
.oauthIcon {
  font-size: 20px;
}

h4 {
  margin-left: 0px;
}

.v-btn.google {
  background-color: #3367d6 !important;
}

.v-btn.linkedin {
  background-color: #283e4a !important;
}

.v-btn.box {
  background-color: #0071f7 !important;
}

.v-btn.globus {
  background-color: #335a95 !important;
}
</style>
