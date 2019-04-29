<template lang="pug">
v-app.app
  v-toolbar.toolbar-main(v-show="!loggedOut", color="primary", dark)
    v-toolbar-title Girder Web Components
    v-toolbar-items
      v-menu(
          offset-y,
          left,
          :close-on-content-click="false",
          content-class="girder-search-arrow-menu",
          v-model="uiOptionsMenu")
        v-btn(icon, slot="activator")
          v-icon.mdi-24px {{ $vuetify.icons.more }}
        v-card
          v-card-actions
            v-layout(column)
              v-checkbox.mt-2(hide-details, label="Select", v-model="selectEnabled")
              v-checkbox.mt-1(hide-details, label="Draggable", v-model="dragEnabled")
              v-checkbox.mt-1(hide-details, label="New Folder", v-model="newFolderEnabled")
              v-checkbox.mt-1(hide-details, label="Upload", v-model="newItemEnabled")
              v-checkbox.mt-1.mb-1(hide-details, label="Search Box", v-model="searchEnabled")
    v-spacer
    girder-search(v-if="searchEnabled", @select="handleSearchSelect")
    v-btn(flat, icon, @click="girderRest.logout()")
      v-icon $vuetify.icons.logout
  v-dialog(:value="loggedOut", persistent, full-width, max-width="600px")
    girder-auth(
        :force-otp="false",
        :register="true",
        :oauth="true",
        :key="girderRest.token",
        :forgot-password-url="forgotPasswordUrl")
  v-dialog(v-model="uploader", full-width, max-width="800px")
    girder-upload(
        v-if="uploadDest",
        :dest="uploadDest",
        :post-upload="postUpload",
        multiple="multiple")
  v-dialog(v-model="newFolder", full-width, max-width="800px")
    girder-upsert-folder(
        v-if="nonRootLocation(location)",
        :key="location._id",
        :location="location",
        :post-upsert="postUpsert",
        @dismiss="newFolder = false")
  v-container(v-show="!loggedOut", fluid)
    v-layout(row, wrap)
      v-flex.mr-2(grow)
        v-card
          girder-data-browser(
              ref="girderBrowser",
              :location.sync="location",
              :select-enabled="selectEnabled",
              :draggable="dragEnabled",
              :new-item-enabled="newItemEnabled",
              :new-folder-enabled="newFolderEnabled",
              @click:newitem="uploader = true",
              @click:newfolder="newFolder = true",
              @selection-changed="selected = $event")
</template>

<script>
import {
  Authentication as GirderAuth,
  DataBrowser as GirderDataBrowser,
  Search as GirderSearch,
  Upload as GirderUpload,
  UpsertFolder as GirderUpsertFolder,
} from '@/components';
import { getLocationValidator } from '@/utils';

export default {
  name: 'App',
  inject: ['girderRest'],
  components: {
    GirderAuth,
    GirderDataBrowser,
    GirderSearch,
    GirderUpload,
    GirderUpsertFolder,
  },
  data() {
    return {
      multiple: true,
      uploader: false,
      newFolder: false,
      uiOptionsMenu: false,
      browserLocation: null,
      forgotPasswordUrl: '/#?dialog=resetpassword',
      dragEnabled: false,
      selectEnabled: true,
      newItemEnabled: true,
      newFolderEnabled: true,
      searchEnabled: true,
      selected: [],
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
        return { type: 'root' };
      },
      set(newVal) {
        this.browserLocation = newVal;
      },
    },
    loggedOut() {
      return this.girderRest.user === null;
    },
    uploadDest() {
      if (this.location) {
        return this.location._modelType === 'folder' ? this.location : this.folder;
      }
      return null;
    },
  },
  methods: {
    nonRootLocation: getLocationValidator(false),
    postUpload() {
      // postUpload is an example of using hooks for greater control of component behavior.
      // here, we can complete the dialog disappear animation before the upload UI resets.
      this.$refs.girderBrowser.refresh();
      this.uploader = false;
      return new Promise(resolve => setTimeout(resolve, 400));
    },
    postUpsert() {
      this.$refs.girderBrowser.refresh();
      this.newFolder = false;
      return new Promise(resolve => setTimeout(resolve, 400));
    },
    handleSearchSelect(item) {
      if (['user', 'folder'].indexOf(item._modelType) >= 0) {
        this.browserLocation = item;
      } else {
        this.browserLocation = { _modelType: 'folder', _id: item.folderId };
      }
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
