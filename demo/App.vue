<script setup>
import { ref, inject, computed, useTemplateRef } from 'vue'
import { useTheme } from 'vuetify'

import Headline from './ComponentHeadline.vue';
import NavLink from './ComponentNavLink.vue';
import { hasAdminAccess } from '@';

// ---- Injected client ----
const { rest, user, token } = inject('girder');

// ---- State ----

const fileManager = useTemplateRef("file-manager");
const theme = useTheme();
const authOauth = ref(true);
const authRegister = ref(true);
const forgotPasswordUrl = ref('/#?dialog=resetpassword');
const badges = ref([
  'https://img.shields.io/circleci/build/github/girder/girder_web_components/master?style=for-the-badge',
  'https://img.shields.io/npm/v/@girder/components?style=for-the-badge',
  'https://img.shields.io/npm/dm/@girder/components?style=for-the-badge',
  'https://img.shields.io/bundlephobia/min/@girder/components?style=for-the-badge',
  'https://img.shields.io/github/stars/girder/girder_web_components?style=for-the-badge',
]);
const currentTheme = ref(theme.global.name.value);
const internalLocation = ref(null);
const dragEnabled = ref(false);
const rootLocationDisabled = ref(false);
const selected = ref([]);
const selectable = ref(true);
const uploadEnabled = ref(true);
const uploadMultiple = ref(true);
const upsertEdit = ref(false);
const newFolderEnabled= ref(true);
const dropped = ref([]);
const droppedStrings = ref([]);

// ---- Computed ----
const loggedOut = computed(() => !user.value);
const location = computed({
  get() {
    return internalLocation.value ||
      (loggedOut.value
        ? {
            _id: '5c8a72438d777f072b97f9e1',
            _modelType: 'folder',
          }
        : user.value
      );
  },
  set(value) {
    internalLocation.value = value;
  },
});
const uploadDest = computed(() => {
  if (location.value._modelType === 'folder') {
    return location.value;
  }
  return {
    name: 'temp',
    _id: '5e2a25fdaf2e2eed35309112',
    _modelType: 'folder',
  };
});
const detailsList = computed(() => {
  if (selected.value.length) {
    return selected.value;
  } if (location.value && location.value._id) {
    return [location.value];
  }
  return [];
});

// ---- Methods ----
function logout() {
  rest.logout();
}

function dragEnd({ items }) {
  dropped.value = items;
}

function drop(event) {
  droppedStrings.value = event.dataTransfer.getData('application/x-girder-items');
}

function handleSearchSelect(item) {
  if (['user', 'folder'].indexOf(item._modelType) >= 0) {
    location.value = item;
  } else {
    location.value = { _modelType: 'folder', _id: item.folderId };
  }
}

function handleAction(action) {
  if (action.name === 'Delete') {
    fileManager.value?.refresh();
    selected.value = [];
  }
}

function postUpload() {
  fileManager.value?.refresh();
}
</script>

<template>
  <v-app class="app">
    <v-navigation-drawer app>
      <v-list nav>
        <a class="text-h6">Components</a>
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
          title="File Manager"
          href="#file-manager"
        />
        <nav-link
          title="Data details"
          href="#data-details"
        />
        <nav-link
          title="Access Control"
          href="#access-control"
        />
        <nav-link
          title="Upsert Folder"
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
          <div class="text-h3 d-flex justify-space-between">
            Girder Web Components
            <v-switch
              v-model="currentTheme"
              value="dark"
              false-value="light"
              class="mx-4 my-0"
              hide-details="hide-details"
              label="Dark theme"
              inset
              @click="theme.toggle()"
            />
          </div>
          <div class="text-subtitle-1 mb-1">
            A Vue + Vuetify library for interacting with
            <a href="https://www.kitware.com/">Kitware's</a>
            data management platform,
            <a href="https://girder.readthedocs.io/en/stable/">Girder</a>
          </div>
          <img
            v-for="badge in badges"
            :key="badge"
            :src="badge"
            class="pr-3"
          >
          <div class="text-subtitle-1">
            This demo integrates with
            <a href="https://data.kitware.com">data.kitware.com</a>
          </div>

          <a id="auth" />
          <headline
            title="girder-authentication"
            link="src/components/Authentication/Authentication.vue"
            description="allows users to authenticate with girder"
          />
          <v-row class="ma-2">
            <v-switch
              v-model="authRegister"
              class="ma-2"
              hide-details="hide-details"
              label="Register tab"
              color="primary"
            />
            <v-switch
              v-model="authOauth"
              class="ma-2"
              hide-details="hide-details"
              label="OAuth options"
              color="primary"
            />
          </v-row>
          <girder-authentication
            v-if="loggedOut"
            :key="token"
            :force-otp="false"
            :register="authRegister"
            :oauth="authOauth"
            :forgot-password-url="forgotPasswordUrl"
          />
          <v-btn
            v-else
            color="primary"
            prepend-icon="$logout"
            @click="logout()"
          >
            Log Out
          </v-btn>

          <a id="upload" />
          <headline
            title="girder-upload"
            link="src/components/Upload/Upload.vue"
            description="upload files to a specified location in girder"
          />
          <girder-upload
            :dest="uploadDest"
            :post-upload="postUpload"
          />
          <a id="search" />
          <headline
            title="girder-search"
            link="src/components/Search.vue"
            description="provides global search functionality"
          />
          <v-card class="pa-3">
            <girder-search @select="handleSearchSelect" />
          </v-card>
          
          <v-row>
            <v-col
              xl="8"
              lg="8"
              md="6"
              sm="12"
            >
              <a id="file-manager" />
              <headline
                title="girder-file-manager"
                link="src/components/FileManager.vue"
                description="a wrapper around girder-data-browser. It packages the browser with
                defaults including folder creation, item upload, and a breadcrumb bar"
              />
            </v-col>
            <v-col
              xl="4"
              lg="4"
              md="6"
              sm="12"
            >
              <a id="data-details" />
              <headline
                title="girder-data-details"
                link="src/components/DataDetails/DataDetails.vue"
                description="in-depth information and controls for a single folder or item, or
                batch operations for groups of objects."
              />
            </v-col>
          </v-row>
          <v-row class="ma-2 justify-space-around">
            <v-switch
              v-model="selectable"
              hide-details="hide-details"
              label="Select"
              color="primary"
            />
            <v-switch
              v-model="dragEnabled"
              hide-details="hide-details"
              label="Draggable"
              color="primary"
            />
            <v-switch
              v-model="newFolderEnabled"
              hide-details="hide-details"
              label="New Folder"
              color="primary"
            />
            <v-switch
              v-model="uploadEnabled"
              hide-details="hide-details"
              label="Upload"
              color="primary"
            />
            <v-switch
              v-model="rootLocationDisabled"
              hide-details="hide-details"
              label="Root Disabled"
              color="primary"
            />
          </v-row>
          <v-row>
            <v-col
              xl="8"
              lg="8"
              md="6"
              sm="12"
            >
              <girder-file-manager
                ref="file-manager"
                v-model:selected="selected"
                v-model:location="location"
                :items-per-page-options="[10, 20, -1]"
                :drag-enabled="dragEnabled"
                :new-folder-enabled="newFolderEnabled"
                :selectable="selectable"
                :root-location-disabled="rootLocationDisabled"
                :upload-multiple="uploadMultiple"
                :upload-enabled="uploadEnabled"
                @drag-end="dragEnd"
              >
                <template #row="props">
                  <i>{{ props.item.name }}</i>
                </template>
              </girder-file-manager>
              <v-card
                v-if="dragEnabled"
                title="Drop Zone"
                class="mt-3"
                @dragenter.prevent=""
                @dragover.prevent=""
                @drop="drop"
              >
                <v-card-text>
                  <p v-if="!(dropped.length)">
                    Drag a row here to see results
                  </p>
                  <v-list-item
                    v-for="{ item } in dropped"
                    v-else
                    :key="item._id"
                    :title="item.name"
                    :subtitle="`${item._modelType} -- ${item.size}`"
                  />
                </v-card-text>
              </v-card>
            </v-col>
            <v-col
              xl="4"
              lg="4"
              md="6"
              sm="12"
            >
              <girder-data-details
                :value="detailsList"
                :new-folder-enabled="newFolderEnabled"
                @action="handleAction"
              />
            </v-col>
          </v-row>

          <a id="access-control" />
          <headline
            title="girder-access-control"
            link="src/components/AccessControl.vue"
            description="access controls for folders and items"
          />
          <girder-access-control
            v-if="hasAdminAccess(uploadDest)"
            :model="uploadDest"
          />
          <v-card
            v-else
            text="Must have Admin access to folder or collection"
          />

          <a id="upsert-folder" />
          <headline
            title="girder-upsert-folder"
            link="src/components/UpsertFolder.vue"
            description="create and edit folders"
          />
          <v-row class="ma-2">
            <v-switch
              v-model="upsertEdit"
              label="Edit Mode"
              hide-details
              color="primary"
            />
          </v-row>
          <girder-upsert-folder
            :location="uploadDest"
            :edit="upsertEdit"
          />
          
          <a id="breadcrumb" />
          <headline
            title="girder-breadcrumb"
            link="src/components/Breadcrumb.vue"
            description="filesystem path breadcrumb"
          />
          <v-card class="pa-3">
            <girder-breadcrumb :location="uploadDest" />
          </v-card>
        </v-col>
      </v-container>
    </v-main>
  </v-app>
</template>
