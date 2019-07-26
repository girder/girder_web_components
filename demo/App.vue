<template lang="pug">
v-app.app
  v-content
    v-toolbar.toolbar-main(color="primary", dark)
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
                v-checkbox.mt-1(hide-details, label="Worker Jobs", v-model="jobsEnabled")
                v-divider.mt-2.mb-1
                v-checkbox.mt-1(hide-details, label="Data Browser", v-model="browserEnabled")
                v-checkbox.mt-1(hide-details, label="Select", v-model="selectable")
                v-checkbox.mt-1(hide-details, label="Draggable", v-model="dragEnabled")
                v-checkbox.mt-1(hide-details, label="New Folder", v-model="newFolderEnabled")
                v-checkbox.mt-1(hide-details, label="Upload", v-model="uploadEnabled")
                v-checkbox.mt-1(hide-details, label="Root Disabled", v-model="rootLocationDisabled")
                v-divider.mt-2.mb-1
                v-checkbox.mt-1.mb-1(hide-details, label="Search Box", v-model="searchEnabled")

      v-spacer
      girder-search(v-if="searchEnabled", @select="handleSearchSelect")
      v-btn(flat, icon, @click="girderRest.logout()")
        v-icon $vuetify.icons.logout

    v-container(fluid)
      girder-auth.mb-4(
          v-if="loggedOut",
          :force-otp="false",
          :register="true",
          :oauth="true",
          :key="girderRest.token",
          :forgot-password-url="forgotPasswordUrl")
      girder-file-manager.mb-4(
          v-if="browserEnabled",
          :drag-enabled="dragEnabled",
          :new-folder-enabled="newFolderEnabled",
          :selectable="selectable",
          :location.sync="location",
          :root-location-disabled="rootLocationDisabled",
          :upload-multiple="uploadMultiple",
          :upload-enabled="uploadEnabled",
          @selection-changed="selected = $event")
      girder-job-list(v-if="jobsEnabled")
</template>

<script>
import {
  Authentication as GirderAuth,
  Search as GirderSearch,
} from '@/components';
import { FileManager as GirderFileManager } from '@/components/Snippet';
import { JobList as GirderJobList } from '@/components/Job';

export default {
  name: 'App',
  inject: ['girderRest'],

  components: {
    GirderAuth,
    GirderFileManager,
    GirderSearch,
    GirderJobList,
  },

  data() {
    return {
      browserEnabled: true,
      dragEnabled: false,
      forgotPasswordUrl: '/#?dialog=resetpassword',
      jobsEnabled: false,
      location: null,
      rootLocationDisabled: false,
      searchEnabled: true,
      selected: [],
      selectable: true,
      uiOptionsMenu: false,
      uploadEnabled: true,
      uploadMultiple: true,
      newFolderEnabled: true,
    };
  },

  computed: {
    loggedOut() {
      return this.girderRest.user === null;
    },
  },

  methods: {
    handleSearchSelect(item) {
      if (['user', 'folder'].indexOf(item._modelType) >= 0) {
        this.location = item;
      } else {
        this.location = { _modelType: 'folder', _id: item.folderId };
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
