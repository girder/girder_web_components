<script>
export default {
  name: 'App',
  inject: ['oauthClient', 'girderRest'],
  methods: {
    login() {
      this.oauthClient.redirectToLogin();
    },
    logout() {
      this.girderRest.user = null;
      this.oauthClient.logout();
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
        v-if="girderRest.user"
        text
        @click="logout"
      >{{ girderRest.user.username }}</v-btn>
      <v-btn
        v-else
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
