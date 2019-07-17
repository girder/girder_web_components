<script>
import { setTimeout } from 'timers';

import {
  Upload as GirderUpload,
  UpsertFolder as GirderUpsertFolder,
  DataBrowser as GirderDataBrowser,
  Breadcrumb as GirderBreadcrumb,
} from '../components';
import {
  getLocationType,
  isRootLocation,
  createLocationValidator,
} from '../utils';

export default {
  components: {
    GirderBreadcrumb,
    GirderUpload,
    GirderUpsertFolder,
    GirderDataBrowser,
  },

  props: {
    location: {
      type: Object,
      validator: createLocationValidator(true),
      default: () => { type: 'root' },
    },
    rootLocationAllowed: {
      type: Boolean,
      default: false,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    dragEnabled: {
      type: Boolean,
      default: false,
    },
    uploadEnabled: {
      type: Boolean,
      default: false,
    },
    newFolderEnabled: {
      type: Boolean,
      default: false,
    },
    uploadMultiple: {
      type: Boolean,
      default: false,
    },
    uploadAccept: {
      type: String,
      default: '*',
    },
    preUpload: {
      type: Function,
      default: () => {},
    },
    postUpload: {
      type: Function,
      default: () => {},
    },
    preUpsert: {
      type: Function,
      default: () => {},
    },
    postUpsert: {
      type: Function,
      default: () => {},
    },
  },

  inject: ['girderRest'],

  data() {
    return {
      uploaderDialog: false,
      newFolderDialog: false,
      lazyLocation: null,
    };
  },

  asyncComputed: {
    async defaultLocation() {
      const { user, apiRoot } = this.girderRest;
      if (user) {
        try {
          return (await this.girderRest.get('folder', {
            params: {
              parentType: 'user',
              parentId: user._id,
            },
          })).data[0];
        } catch ({ response }) {
          if (response) {
            this.error = response.data.message;
          } else {
            this.error = `Could not connect to server: ${apiRoot}`;
          }
        }
      } else {
        return { type: 'root' };
      }
      return null;
    },
  },

  computed: {
    internalLocation: {
      get() {
        const { lazyLocation, girderRest } = this;
        const { user } = girderRest;
        if (lazyLocation) {
          return lazyLocation;
        } else if (user) {
          return { _modelType: 'user', _id: user._id };
        }
        return { type: 'root' };
      },
      set(newVal) {
        this.lazyLocation = newVal;
        this.$emit('update:location', newVal);
      },
    },
    uploadDest() {
      const { internalLocation, defaultLocation } = this;
      if (internalLocation) {
        return getLocationType(internalLocation) === 'folder' ? internalLocation : defaultLocation;
      }
      return null;
    },
  },

  methods: {
    isRootLocation,
    postUploadInternal() {
      // postUpload is an example of using hooks for greater control of component behavior.
      // here, we can complete the dialog disappear animation before the upload UI resets.
      this.$refs.girderBrowser.refresh();
      this.uploaderDialog = false;
      return Promise.all([
        new Promise(reolve => setTimeout(400)),
        this.postUpload(),
      ]);
    },
    postUpsertInternal() {
      this.$refs.girderBrowser.refresh();
      this.uploaderDialog = false;
      return Promise.all([
        new Promise(reolve => setTimeout(400)),
        this.postUpsert(),
      ]);
    },
  },
};
</script>

<template lang="pug">
.girder-data-browser-snippet
  v-dialog(v-model="uploaderDialog", full-width, max-width="800px")
    girder-upload(
        v-if="uploadDest",
        :dest="uploadDest",
        :pre-upload="preUpload",
        :post-upload="postUploadInternal",
        :multiple="uploadMultiple")
  v-dialog(v-model="newFolderDialog", full-width, max-width="800px")
    girder-upsert-folder(
        v-if="!isRootLocation(internalLocation)",
        :location="internalLocation",
        :pre-upsert="preUpsert",
        :post-upsert="postUpsertInternal",
        :key="internalLocation._id",
        @dismiss="newFolderDialog = false")
  v-layout(row, wrap)
    v-flex(grow)
      v-card
        girder-data-browser(
            ref="girderBrowser",
            :location.sync="internalLocation",
            :selectable="selectable",
            :draggable="dragEnabled",
            :root-location-allowed="rootLocationAllowed",
            @selection-changed="$emit('selection-changed', $event)"
            @drag="$emit('drag', $event)",
            @dragstart="$emit('dragstart', $event)",
            @dragend="$emit('dragend', $event)",
            @drop="$emit('drop', $event)")
          template(slot="breadcrumb", slot-scope="props")
            girder-breadcrumb(
                :location="props.location",
                @crumbclick="props.changeLocation($event)",
                :root-location-allowed="props.rootLocationAllowed")
          template(slot="headerwidget")
            
            v-dialog(v-model="uploaderDialog",
                v-if="uploadEnabled && !isRootLocation(internalLocation) && girderRest.user",
                full-width, max-width="800px")
              v-btn.ma-0(
                  slot="activator",
                  flat,
                  small,
                  color="secondary darken-2")
                v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.fileNew }}
                span.hidden-xs-only New Item
              girder-upload(
                  v-if="uploadDest",
                  :dest="uploadDest",
                  :pre-upload="preUpload",
                  :post-upload="postUploadInternal",
                  :multiple="uploadMultiple")
            v-dialog(v-model="newFolderDialog",
                v-if="newFolderEnabled && !isRootLocation(internalLocation) && girderRest.user",
                full-width, max-width="800px")
              v-btn.ma-0(
                  flat,
                  small,
                  color="secondary darken-2",
                  slot="activator")
                v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.folderNew }}
                span.hidden-xs-only New Folder
              girder-upsert-folder(
                  v-if="!isRootLocation(internalLocation)",
                  :location="internalLocation",
                  :pre-upsert="preUpsert",
                  :post-upsert="postUpsertInternal",
                  :key="internalLocation._id",
                  @dismiss="newFolderDialog = false")

</template>
