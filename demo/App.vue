<template lang="pug">
v-app.app
  v-app-bar(color="primary", dark, app)
    v-toolbar-title Girder Web Components
    v-toolbar-items
      v-menu(
          offset-y,
          left,
          :close-on-content-click="false",
          content-class="girder-search-arrow-menu",
          v-model="uiOptionsMenu")
        template(#activator="{ on }")
          v-btn(icon, v-on="on")
            v-icon.mdi-24px $vuetify.icons.more
        v-card
          v-card-actions
            v-row
              v-col.py-0
                v-checkbox.mt-1(hide-details, label="Worker Jobs", v-model="jobsEnabled")
                v-divider.mt-2.mb-1
                v-checkbox.mt-1(hide-details, label="Data Browser", v-model="browserEnabled")
                v-checkbox.mt-1(hide-details, label="Select", v-model="selectable")
                v-checkbox.mt-1(hide-details, label="Draggable", v-model="dragEnabled")
                v-checkbox.mt-1(hide-details, label="New Folder", v-model="newFolderEnabled")
                v-checkbox.mt-1(hide-details, label="Upload", v-model="uploadEnabled")
                v-checkbox.mt-1(hide-details,
                    label="Root Disabled",
                    v-model="rootLocationDisabled")
                v-divider.mt-2.mb-1
                v-checkbox.mt-1.mb-1(hide-details, label="Search Box", v-model="searchEnabled")

    v-spacer
    girder-search(v-if="searchEnabled", @select="handleSearchSelect")
    v-btn(v-if="!loggedOut", text, icon, @click="girderRest.logout()")
      v-icon $vuetify.icons.logout
  v-content
    v-container
      v-row
        v-col(v-if="loggedOut", lg=4, md=5, sm=12)
          girder-auth(
              :force-otp="false",
              :register="true",
              :oauth="true",
              :key="girderRest.token",
              :forgot-password-url="forgotPasswordUrl")
        v-col
          girder-file-manager.mb-3(
              v-if="browserEnabled",
              ref="girderFileManager",
              v-model="selected",
              :drag-enabled="dragEnabled",
              :new-folder-enabled="newFolderEnabled",
              :selectable="selectable",
              :location.sync="location",
              :root-location-disabled="rootLocationDisabled",
              :upload-multiple="uploadMultiple",
              :upload-enabled="uploadEnabled")
          girder-job-list(v-if="jobsEnabled")
        v-col(style="max-width: 340px;")
          girder-data-details(:value="detailsList", @action="handleAction")
</template>

<script>
import {
  Authentication as GirderAuth,
  DataDetails as GirderDataDetails,
  Search as GirderSearch,
} from '@/components';
import { FileManager as GirderFileManager } from '@/components/Snippet';
import { JobList as GirderJobList } from '@/components/Job';

export default {
  name: 'App',
  inject: ['girderRest'],

  components: {
    GirderAuth,
    GirderDataDetails,
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
      internalLocation: null,
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
    location: {
      get() {
        return this.internalLocation || (
          this.loggedOut ? { type: 'collections' } : this.girderRest.user
        );
      },
      set(value) {
        this.internalLocation = value;
      },
    },
    detailsList() {
      if (this.selected.length) {
        return this.selected;
      } else if (this.location) {
        return [this.location];
      }
      return [];
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
    handleAction(action) {
      if (action.name === 'Delete') {
        this.$refs.girderFileManager.refresh();
        this.selected = [];
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
