<template lang="pug">
v-app.app
  v-dialog(v-model="loggedOut", width="50%", persistent)
    girder-auth(
        :register="true",
        :oauth="true",
        :forgot-password-url="forgotPasswordUrl")
  v-dialog(v-model="uploader", width="70%")
    girder-upload(v-if="uploader",
        :dest="uploadDest",
        multiple="multiple",
        @done="$refs.girderBrowser.refresh()")
  girder-file-browser(ref="girderBrowser",
      v-if="!loggedOut && location",
      :location.sync="location",
      :refresh="refresh",
      @click:newitem="uploader = true")
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
      multiple: true,
      uploader: false,
      refresh: 0,
      location: null,
      forgotPasswordUrl: '/#?dialog=resetpassword',
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
  computed: {
    loggedOut() { return this.girderRest.user === null; },
    uploadDest() {
      if (this.location.type === 'folder') {
        return {
          name: this.location.name,
          _id: this.location.id,
          _modelType: this.location.type,
        };
      }
      return this.folder;
    },
  },
  mounted() {
    this.location = this.resetLocation();
    this.girderRest.$on('login', () => {
      this.location = this.resetLocation();
    });
  },
  methods: {
    resetLocation() {
      if (this.girderRest.user) {
        return { type: 'user', id: this.girderRest.user._id };
      }
      return null;
    },
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Barlow+Condensed:300,300i,400,400i,600,600i');

.app {
  font-family: "Barlow Condensed", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
