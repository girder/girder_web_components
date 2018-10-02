<template lang="pug">
v-app.app(v-if="ready")
  v-layout(justify-center v-if="folder")
    v-flex(sm10 md8)
      girder-file-browser(:initial="fileBrowserInitial")
  //- girder-upload(v-if="folder", :dest="folder", :multiple="multiple")
  v-layout(v-else, justify-center)
    v-flex(xs12, sm10, md8, lg6)
      girder-auth(
          :register="true",
          :oauth="true",
          :forgot-password-url="forgotPasswordUrl")
</template>

<script>
import {
  Upload as GirderUpload,
  Authentication as GirderAuth,
  FileBrowser as GirderFileBrowser,
} from './components';

export default {
  name: 'App',
  inject: ['girderRest'],
  components: {
    GirderUpload,
    GirderAuth,
    GirderFileBrowser,
  },
  data() {
    return {
      ready: false,
      error: null,
      folder: null,
      multiple: true,
      forgotPasswordUrl: '/#?dialog=resetpassword',
      fileBrowserInitial: {},
    };
  },
  asyncComputed: {
    async folder() {
      if (this.girderRest.user) {
        try {
          return (await this.girderRest.get('folder', {
            params: {
              parentType: 'user',
              parentId: this.girderRest.user._id,
            },
          })).data[0];
        } catch ({ response }) {
          if (response) {
            this.error = response.data.message;
          } else {
            this.error = `Could not connect to server: ${this.girderRest.apiRoot}`;
          }
        }
      }
      return null;
    },
  },
};
</script>

<style lang="scss">
.app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
