<template>
  <v-app class="app">
    <v-navigation-drawer app="app">
      <v-list>
        <nav-link
          class="mb-1 font-weight-bold"
          title="Components"
        />
        <nav-link
          title="Authentication"
          href="#auth"
        />
        <nav-link
          title="Upload"
          href="#upload"
        />
        <nav-link
          title="Search"
          href="#search"
        />
        <nav-link
          title="File manager"
          href="#file-manager"
        />
        <nav-link
          title="Data details"
          href="#data-details"
        />
        <nav-link
          title="Job list"
          href="#job-list"
        />
        <nav-link
          title="Access control"
          href="#access-control"
        />
        <nav-link
          title="Add / edit folder"
          href="#upsert-folder"
        />
        <nav-link
          title="Breadcrumb"
          href="#breadcrumb"
        />
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container>
        <v-col
          xl="8"
          offset-xl="2"
          lg="10"
          offset-lg="1"
          md="12"
          offset-md="0"
        >
          <div class="display-3">
            Girder Web Components
          </div>
          <div class="title mb-1">
            A Vue + Vuetify library for interacting with
            <a href="https://www.kitware.com/">Kitware's</a>
            data management platform,
            <a href="https://girder.readthedocs.io/en/stable/">Girder</a>
          </div><img
            v-for="badge in badges"
            :key="badge"
            :src="badge"
            class="pr-3"
          >
          <v-row class="ma-0">
            <div class="title mb-1">
              This demo integrates with
              <a href="https://data.kitware.com">data.kitware.com</a>
            </div>
            <v-switch
              v-model="$vuetify.theme.dark"
              class="mx-4 my-0"
              hide-details="hide-details"
              label="Dark theme"
            />
          </v-row><a id="auth" />
          <headline
            title="girder-auth"
            link="src/components/Authentication/Authentication.vue"
            description="allows users to authenticate with girder"
          />
          <v-row class="mb-2">
            <v-switch
              v-model="authRegister"
              class="ma-2"
              hide-details="hide-details"
              label="register"
            />
            <v-switch
              v-model="authOauth"
              class="ma-2"
              hide-details="hide-details"
              label="oauth"
            />
          </v-row><template v-if="loggedOut">
            <girder-auth
              :key="girderRest.token"
              :force-otp="false"
              :register="authRegister"
              :oauth="authOauth"
              :forgot-password-url="forgotPasswordUrl"
            />
          </template><template v-else>
            <v-btn
              v-if="!loggedOut"
              color="primary"
              @click="girderRest.logout()"
            >
              Log Out
              <v-icon class="pl-2">
                $vuetify.icons.logout
              </v-icon>
            </v-btn>
          </template><a id="upload" />
          <headline
            title="girder-upload"
            link="src/components/Upload.vue"
            description="upload files to a specified location in girder"
          />
          <v-card>
            <girder-upload
              :dest="uploadDest"
              :max-show="20"
              :post-upload="postUpload"
            />
          </v-card><a id="search" />
          <headline
            title="girder-search"
            link="src/components/Search.vue"
            description="provides global search functionality"
          />
          <v-toolbar color="primary">
            <girder-search @select="handleSearchSelect" />
          </v-toolbar>
          <v-row>
            <v-col
              class="pr-4"
              xl="8"
              lg="8"
              md="6"
              sm="12"
            >
              <a id="file-manager" />
              <headline
                title="girder-file-manager"
                link="src/components/Snippet/FileManager.vue"
                description="a wrapper around girder-data-browser. It packages the browser with
                defaults including folder creation, item upload, and a breadcrumb bar"
              />
            </v-col>
            <v-col class="pa-0">
              <a id="data-details" />
              <headline
                title="girder-data-details"
                link="src/components/DataDetails.vue"
                description="in-depth information and controls for a single folder or item, or
                batch operations for groups of objects."
              />
            </v-col>
          </v-row>
          <v-row>
            <v-switch
              v-model="selectable"
              class="ma-2"
              hide-details="hide-details"
              label="Select"
            />
            <v-switch
              v-model="dragEnabled"
              class="ma-2"
              hide-details="hide-details"
              label="Draggable"
            />
            <v-switch
              v-model="newFolderEnabled"
              class="ma-2"
              hide-details="hide-details"
              label="New Folder"
            />
            <v-switch
              v-model="uploadEnabled"
              class="ma-2"
              hide-details="hide-details"
              label="Upload"
            />
            <v-switch
              v-model="rootLocationDisabled"
              class="mt-2"
              hide-details="hide-details"
              label="Root Disabled"
            />
          </v-row>
          <v-row>
            <v-col
              class="pr-4"
              lg="8"
              md="6"
              sm="12"
            >
              <girder-file-manager
                ref="girderFileManager"
                v-model="selected"
                :items-per-page-options="[10, 20, -1]"
                :drag-enabled="dragEnabled"
                :new-folder-enabled="newFolderEnabled"
                :selectable="selectable"
                :location.sync="location"
                :root-location-disabled="rootLocationDisabled"
                :upload-multiple="uploadMultiple"
                :upload-enabled="uploadEnabled"
                @dragend="dragend"
              />
              <v-card
                v-if="dragEnabled"
                class="mt-4"
                @dragenter.prevent=""
                @dragover.prevent=""
                @drop="drop"
              >
                <v-card-title>Drop Zone</v-card-title>
                <v-card-text>
                  <p v-if="!(dropped.length)">
                    Drag a row here to see results
                  </p>
                  <ul
                    v-for="{ item } in dropped"
                    v-else
                    :key="item._id"
                    class="header"
                  >
                    <li>type: {{ item._modelType }}</li>
                    <li>name: {{ item.name }} </li>
                    <li>size: {{ item.size }}</li>
                  </ul>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col
              class="pl-0"
              lg="4"
              md="6"
              sm="12"
            >
              <girder-data-details
                :value="detailsList"
                @action="handleAction"
              />
            </v-col>
          </v-row><a id="job-list" />
          <headline
            title="girder-job-list"
            link="src/components/Job/JobList.vue"
            description="display and filter girder jobs"
          />
          <girder-job-list /><a id="access-control" />
          <headline
            title="girder-access-control"
            link="src/components/AccessControl.vue"
            description="access controls for folders and items"
          />
          <girder-access-control :model="uploadDest" /><a id="upsert-folder" />
          <headline
            title="girder-upsert-folder"
            link="src/components/UpsertFolder.vue"
            description="create and edit folders"
          />
          <v-switch
            v-model="upsertEdit"
            label="Edit Mode"
          />
          <v-card>
            <girder-upsert-folder
              :location="uploadDest"
              :edit="upsertEdit"
            />
          </v-card><a id="breadcrumb" />
          <headline
            title="girder-breadcrumb"
            link="src/components/Breadcrumb.vue"
            description="filesystem path breadcrumb"
          />
          <v-card class="pa-4">
            <girder-breadcrumb :location="uploadDest" />
          </v-card>
        </v-col>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import {
  AccessControl as GirderAccessControl,
  Authentication as GirderAuth,
  Breadcrumb as GirderBreadcrumb,
  DataDetails as GirderDataDetails,
  Search as GirderSearch,
  Upload as GirderUpload,
  UpsertFolder as GirderUpsertFolder,
} from '@/components';
import { FileManager as GirderFileManager } from '@/components/Snippet';
import { JobList as GirderJobList } from '@/components/Job';

import Headline from './Headline.vue';
import NavLink from './NavLink.vue';

export default {
  name: 'App',
  inject: ['girderRest'],

  components: {
    Headline,
    NavLink,
    GirderAccessControl,
    GirderAuth,
    GirderBreadcrumb,
    GirderDataDetails,
    GirderFileManager,
    GirderJobList,
    GirderSearch,
    GirderUpload,
    GirderUpsertFolder,
  },

  data() {
    return {
      authOauth: true,
      authRegister: true,
      dragEnabled: false,
      forgotPasswordUrl: '/#?dialog=resetpassword',
      internalLocation: null,
      rootLocationDisabled: false,
      selected: [],
      selectable: true,
      uploadEnabled: true,
      uploadMultiple: true,
      upsertEdit: false,
      newFolderEnabled: true,
      // badges
      badges: [
        'https://img.shields.io/circleci/build/github/girder/girder_web_components/master?style=for-the-badge',
        'https://img.shields.io/npm/v/@girder/components?style=for-the-badge',
        'https://img.shields.io/npm/dm/@girder/components?style=for-the-badge',
        'https://img.shields.io/bundlephobia/min/@girder/components?style=for-the-badge',
        'https://img.shields.io/github/stars/girder/girder_web_components?style=for-the-badge',
      ],
      dropped: [],
      droppedStrings: [],
    };
  },

  computed: {
    loggedOut() {
      return this.girderRest.user === null;
    },
    location: {
      get() {
        return this.internalLocation || (
          this.loggedOut ? {
            _id: '5c8a72438d777f072b97f9e1',
            _modelType: 'folder',
          } : this.girderRest.user
        );
      },
      set(value) {
        this.internalLocation = value;
      },
    },
    uploadDest() {
      if (this.location._modelType === 'folder') {
        return this.location;
      }
      return {
        name: 'temp',
        _id: '5e2a25fdaf2e2eed35309112',
        _modelType: 'folder',
      };
    },
    detailsList() {
      if (this.selected.length) {
        return this.selected;
      } if (this.location && this.location._id) {
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
    postUpload() {
      this.$refs.girderFileManager.refresh();
    },
    dragend({ items }) {
      // demonstrate how to get dropped item list from data table, which is the source
      // of the drag event.
      this.dropped = items;
    },
    drop(event) {
      // demonstrate how to get dropped item details from the destination drop event
      // note that this value is unused in the app, and exists only for documentation.
      this.droppedStrings = event.dataTransfer.getData('application/x-girder-items');
    },
  },
};
</script>

<style lang="scss" scoped>
.app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
