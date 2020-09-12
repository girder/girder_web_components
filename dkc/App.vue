<script>

export default {
  name: 'App',
};
</script>

<template>
  <v-app class="app">
    <v-app-bar app>
      <v-app-bar-nav-icon />
      <v-toolbar-title>Kitware Data</v-toolbar-title>
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
