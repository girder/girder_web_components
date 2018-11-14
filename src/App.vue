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
      browserLocation: null,
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
    location: {
      get() {
        if (this.browserLocation) {
          return this.browserLocation;
        } else if (this.girderRest.user) {
          return { type: 'user', id: this.girderRest.user._id };
        }
        return null;
      },
      set(newVal) {
        this.browserLocation = newVal;
      },
    },
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
};
</script>

<style lang="scss">
.app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
