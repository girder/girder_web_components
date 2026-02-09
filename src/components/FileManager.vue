<script>
import { ref, computed, inject, nextTick, reactive, useTemplateRef } from 'vue';

import GirderUpload from './Upload';
import GirderUpsertFolder from './UpsertFolder.vue';
import GirderDataBrowser from './DataBrowser';
import GirderBreadcrumb from './Breadcrumb.vue';
import GirderAccessControl from './AccessControl.vue';

import {
  getLocationType,
  isRootLocation,
  createLocationValidator,
} from '@/utils';

export default {
  name: 'GirderFileManager',

  components: {
    GirderAccessControl,
    GirderBreadcrumb,
    GirderUpload,
    GirderUpsertFolder,
    GirderDataBrowser,
  },

  props: {
    selected: { type: Array, default: () => [] },
    location: { type: Object, default: null, validator: createLocationValidator(true) },
    rootLocationDisabled: { type: Boolean, default: false },
    noAccessControl: { type: Boolean, default: false },
    selectable: { type: Boolean, default: false },
    dragEnabled: { type: Boolean, default: false },
    uploadEnabled: { type: Boolean, default: false },
    newFolderEnabled: { type: Boolean, default: false },
    uploadMaxShow: { type: Number, default: 0 },
    uploadMultiple: { type: Boolean, default: false },
    uploadAccept: { type: String, default: '*' },
    preUpload: { type: Function, default: async () => { } },
    postUpload: { type: Function, default: async () => { } },
    preUpsert: { type: Function, default: async () => { } },
    postUpsert: { type: Function, default: async () => { } },
    itemsPerPage: { type: Number, default: 10 },
    itemsPerPageOptions: { type: Array, default: () => [10, 25, 50] },
  },

  emits: [
    'update:selected',
    'update:location',
    'update:options',
    'rowClick',
    'rowRightClick',
    'drag',
    'dragStart',
    'dragEnd',
    'drop',
  ],

  setup(props, ctx) {
    // ---- Injected client ----
    const { user } = inject('girder');

    // ---- State ----
    const dataBrowser = useTemplateRef('data-browser');
    const uploaderDialog = ref(false);
    const newFolderDialog = ref(false);

    const collectionAndFolderMenu = reactive({
      show: false,
      x: 0,
      y: 0,
    });

    const actOnItem = ref(null);
    const showAccessControlDialog = ref(false);
    const hasAccessPermission = ref(false);

    const options = reactive({
      itemsPerPage: props.itemsPerPage,
      page: 1,
    });

    // ---- State ----
    const internalLocation = computed({
      get() {
        if (props.location) {return props.location;}
        return { type: 'root' };
      },
      set(val) {
        ctx.emit('update:location', val);
      },
    });

    const uploadDest = computed(() =>
      internalLocation.value &&
        getLocationType(internalLocation.value) === 'folder'
        ? internalLocation.value
        : null,
    );

    const shouldShowNewFolder = computed(() =>
      props.newFolderEnabled &&
      !isRootLocation(internalLocation.value) &&
      user && user.value
    );

    const shouldShowUpload = computed(() =>
      props.uploadEnabled &&
      !isRootLocation(internalLocation.value) &&
      user && user.value &&
      uploadDest.value,
    );

    // ---- Validation ----
    if (!createLocationValidator(!props.rootLocationDisabled)(props.location)) {
      if (!props.rootLocationDisabled) {
        throw new Error(
          'Location is not valid: must not be empty and have an _id and cannot be root',
        );
      }
      throw new Error(
        'Location is not valid: must not be empty and have an _id',
      );
    }

    // ---- Methods ----
    function refresh() {
      dataBrowser.value?.refresh();
    }

    async function postUploadInternal() {
      refresh();
      uploaderDialog.value = false;

      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 400)),
        props.postUpload(),
      ]);
    }

    async function postUpsertInternal() {
      refresh();
      newFolderDialog.value = false;

      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 400)),
        props.postUpsert(),
      ]);
    }

    function rowRightClick({row, event}) {
      if (props.noAccessControl) {return;}
  
      if (['collection', 'folder'].includes(row._modelType)) {
        collectionAndFolderMenu.show = false;
        collectionAndFolderMenu.x = event.clientX;
        collectionAndFolderMenu.y = event.clientY;
        actOnItem.value = row;

        nextTick(() => {
          collectionAndFolderMenu.show = true;
        });
        
        event.preventDefault();
      }
    }

    return {
      actOnItem,
      collectionAndFolderMenu,
      hasAccessPermission,
      internalLocation,
      newFolderDialog,
      options,
      shouldShowNewFolder,
      shouldShowUpload,
      showAccessControlDialog,
      uploadDest,
      uploaderDialog,
      user,
      refresh,
      postUploadInternal,
      postUpsertInternal,
      rowRightClick,
      getLocationType,
      isRootLocation,
    };
  },
};
</script>

<template>
  <v-card class="file-manager">
    <girder-data-browser
      ref="data-browser"
      :location="location"
      :selectable="selectable"
      :draggable="dragEnabled"
      :root-location-disabled="rootLocationDisabled"
      :options="options"
      :items-per-page-options="itemsPerPageOptions"
      :selected="selected"
      @drag="$emit('drag', $event)"
      @drag-end="$emit('dragEnd', $event)"
      @drag-start="$emit('dragStart', $event)"
      @row-right-click="rowRightClick"
      @row-click="$emit('rowClick', $event)"
      @update:location="$emit('update:location', $event)"
      @update:options="$emit('update:options', $event)"
      @update:selected="$emit('update:selected', $event)"
    >
      <template #breadcrumb="breadcrumbProps">
        <girder-breadcrumb
          :location="breadcrumbProps.location"
          :root-location-disabled="breadcrumbProps.rootLocationDisabled"
          @crumb-click="breadcrumbProps.changeLocation($event)"
        />
      </template>
      <template #headerwidget>
        <slot name="headerwidget" />
        <v-btn
          v-if="shouldShowNewFolder"
          v-tooltip="{text: 'New folder', location: 'bottom'}"
          icon
          variant="text"
        >
          <v-icon
            color="primary"
            icon="$folderNew"
          />
          <v-dialog
            v-model="newFolderDialog"
            activator="parent"
            max-width="800px"
          >
            <girder-upsert-folder
              :key="internalLocation._id"
              :location="internalLocation"
              :pre-upsert="preUpsert"
              :post-upsert="postUpsertInternal"
              @dismiss="newFolderDialog = false"
            />
          </v-dialog>
        </v-btn>
        <v-btn
          v-if="shouldShowUpload"
          v-tooltip="{text: 'Upload files', location: 'bottom'}"
          icon
          variant="text"
        >
          <v-icon
            color="primary"
            icon="$fileNew"
          />
          <v-dialog
            v-model="uploaderDialog"
            activator="parent"
            max-width="800px"
          >
            <girder-upload
              :dest="uploadDest"
              :pre-upload="preUpload"
              :post-upload="postUploadInternal"
              :multiple="uploadMultiple"
              :max-show="uploadMaxShow"
              :accept="uploadAccept"
            />
          </v-dialog>
        </v-btn>
      </template>
      <template #row="props">
        <slot
          v-bind="props"
          name="row"
        />
      </template>
    </girder-data-browser>
    <v-overlay
      v-if="hasAccessPermission"
      v-model="collectionAndFolderMenu.show"
      :scrim="false"
    >
      <v-list
        class="context-menu"
        :style="{
          left: `${collectionAndFolderMenu.x}px`,
          top: `${collectionAndFolderMenu.y}px`
        }"
      >
        <v-list-item
          title="Access Control"
          @click="showAccessControlDialog=true"
        />
      </v-list>
    </v-overlay>
    <v-dialog
      v-model="showAccessControlDialog"
      max-width="700px"
      persistent="persistent"
      eager="eager"
      scrollable="scrollable"
    >
      <girder-access-control
        v-if="actOnItem"
        v-model:has-permission="hasAccessPermission"
        :model="actOnItem"
        @close="showAccessControlDialog=false"
        @update:model-access="refresh"
      />
    </v-dialog>
  </v-card>
</template>

<style lang="scss">
.context-menu {
  padding: 0;
  position: fixed;
  display: flex;
}
</style>