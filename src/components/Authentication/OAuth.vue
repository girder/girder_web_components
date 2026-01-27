<script>
export default {
  name: "GirderOAuth",

  props: {
    verb: { type: String, default: "Sign in" },
    providers: { type: Array, required: true },
  },

  setup() {
    return {
      iconMap: {
        github: "$github",
        google: "$google",
        linkedin: "$linkedin",
        bitbucket: "$bitbucket",
        box: "$box_com",
        globus: "$globe",
        microsoft: "$microsoft",
      },
    };
  }
};
</script>

<template>
  <v-container class="oauth-widget">
    <v-btn
      v-for="provider in providers"
      :key="provider.id"
      variant="tonal"
      rounded
      :href="provider.url"
      class="ml-0 mr-3"
      :prepend-icon="iconMap[provider.id]"
      style="text-transform: none;"
    >
      {{ verb }}
      with
      {{ provider.name }}
    </v-btn>
  </v-container>
</template>
