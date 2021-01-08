<script>

export default {
  name: 'App',
  inject: ['oauthClient'],
  methods: {
    login() {
      this.oauthClient.redirectToLogin();
    },
  },
};
</script>

<template>
  <v-app class="app">
    <v-app-bar app>
      <v-app-bar-nav-icon />
      <v-toolbar-title>Kitware Data</v-toolbar-title>
      <v-spacer />
      <v-btn
        text
        @click="login"
      >Login</v-btn>
    </v-app-bar>
    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style lang="scss" scoped>
.app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
