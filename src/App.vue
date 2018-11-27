<template lang="pug">
v-app.app
  v-container
    h4.display-1.pb-3 Girder Vue Demo
    v-dialog(v-model="loggedOut", full-width, max-width="600px")
      girder-auth(
          :register="true",
          :oauth="true",
          :forgot-password-url="forgotPasswordUrl")
    v-dialog(v-model="uploader", full-width, max-width="800px")
      girder-upload(v-if="uploader",
          :dest="uploadDest",
          multiple="multiple",
          @done="$refs.girderBrowser.refresh(); uploader = false;")
    v-dialog(v-model="newFolder", full-width, max-width="800px")
      girder-upsert-folder(v-if="newFolder",
          :location="location",
          @dismiss="newFolder = false",
          @done="$refs.girderBrowser.refresh(); newFolder = false;")
    v-card
      girder-data-browser(ref="girderBrowser",
          v-if="!loggedOut && location",
          :location.sync="location",
          @click:newitem="uploader = true",
          @click:newfolder="newFolder = true")
</template>

<script>
import {
  Authentication as GirderAuth,
  DataBrowser as GirderDataBrowser,
  Upload as GirderUpload,
  UpsertFolder as GirderUpsertFolder,
} from './components';

export default {
  name: 'App',
  inject: ['girderRest'],
  components: {
    GirderAuth,
    GirderDataBrowser,
    GirderUpload,
    GirderUpsertFolder,
  },
  data() {
    return {
      multiple: true,
      uploader: false,
      newFolder: false,
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
          return { _modelType: 'user', _id: this.girderRest.user._id };
        }
        return null;
      },
      set(newVal) {
        this.browserLocation = newVal;
      },
    },
    loggedOut() {
      return this.girderRest.user === null;
    },
    uploadDest() {
      return this.location._modelType === 'folder' ? this.location : this.folder;
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
