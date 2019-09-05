<script>
import { setTimeout } from 'timers';

import {
  Upload as GirderUpload,
  UpsertFolder as GirderUpsertFolder,
  DataBrowser as GirderDataBrowser,
  Breadcrumb as GirderBreadcrumb,
} from '../';
import {
  getLocationType,
  isRootLocation,
  createLocationValidator,
} from '../../utils';

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
      default: null,
    },
    rootLocationDisabled: {
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
      default: async () => {},
    },
    postUpload: {
      type: Function,
      default: async () => {},
    },
    preUpsert: {
      type: Function,
      default: async () => {},
    },
    postUpsert: {
      type: Function,
      default: async () => {},
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

  computed: {
    internalLocation: {
      get() {
        const { location, lazyLocation } = this;
        if (location) {
          return location;
        } else if (lazyLocation) {
          return lazyLocation;
        }
        return { type: 'root' };
      },
      set(newVal) {
        this.lazyLocation = newVal;
        this.$emit('update:location', newVal);
      },
    },
    uploadDest() {
      const { internalLocation } = this;
      return (internalLocation && getLocationType(internalLocation) === 'folder')
        ? internalLocation
        : null;
    },
    shouldShowUpload() {
      return this.uploadEnabled
        && !isRootLocation(this.internalLocation)
        && this.girderRest.user
        && this.uploadDest;
    },
  },

  created() {
    if (!createLocationValidator(!this.rootLocationDisabled)(this.internalLocation)) {
      throw new Error('root location cannot be used when root-location-disabled is true');
    }
  },

  methods: {
    isRootLocation,
    postUploadInternal() {
      // postUpload is an example of using hooks for greater control of component behavior.
      // here, we can complete the dialog disappear animation before the upload UI resets.
      this.$refs.girderBrowser.refresh();
      this.uploaderDialog = false;
      return Promise.all([
        new Promise(resolve => setTimeout(resolve, 400)),
        this.postUpload(),
      ]);
    },
    postUpsertInternal() {
      this.$refs.girderBrowser.refresh();
      this.newFolderDialog = false;
      return Promise.all([
        new Promise(resolve => setTimeout(resolve, 400)),
        this.postUpsert(),
      ]);
    },
  },
};
</script>

<template lang="pug">
.girder-data-browser-snippet
  v-row
    v-col
      v-card
        girder-data-browser(
            ref="girderBrowser",
            :location.sync="internalLocation",
            :selectable="selectable",
            :draggable="dragEnabled",
            :root-location-disabled="rootLocationDisabled",
            @selection-changed="$emit('selection-changed', $event)",
            @rowclick="$emit('rowclick', $event)",
            @drag="$emit('drag', $event)",
            @dragstart="$emit('dragstart', $event)",
            @dragend="$emit('dragend', $event)",
            @drop="$emit('drop', $event)")
          template(#breadcrumb="props")
            girder-breadcrumb(
                :location="props.location",
                @crumbclick="props.changeLocation($event)",
                :root-location-disabled="props.rootLocationDisabled")
          template(#headerwidget)
            v-dialog(v-model="uploaderDialog",
                v-if="shouldShowUpload",
                full-width, max-width="800px")
              template(#activator="{ on }")
                v-btn.ma-0(
                    v-on="on",
                    text,
                    small,
                    color="secondary darken-2")
                  v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.values.fileNew }}
                  span.hidden-xs-only New Item
              girder-upload(
                  :dest="uploadDest",
                  :pre-upload="preUpload",
                  :post-upload="postUploadInternal",
                  :multiple="uploadMultiple")
            v-dialog(v-model="newFolderDialog",
                v-if="newFolderEnabled && !isRootLocation(internalLocation) && girderRest.user",
                full-width, max-width="800px")
              template(#activator="{ on }")
                v-btn.ma-0(
                    v-on="on",
                    text,
                    small,
                    color="secondary darken-2")
                  v-icon.mdi-24px.mr-1(left, color="accent") {{  $vuetify.icons.values.folderNew }}
                  span.hidden-xs-only New Folder
              girder-upsert-folder(
                  :location="internalLocation",
                  :pre-upsert="preUpsert",
                  :post-upsert="postUpsertInternal",
                  :key="internalLocation._id",
                  @dismiss="newFolderDialog = false")
</template>
