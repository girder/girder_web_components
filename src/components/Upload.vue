<template>
  <v-card
    class="fill-height"
    flat="flat"
  >
    <v-row
      class="flex-column flex-nowrap fill-height"
      no-gutters="no-gutters"
    >
      <slot name="header">
        <v-card-title primary-title="primary-title">
          <div>
            <div
              v-if="!hideHeadline"
              class="headline"
            >
              Upload to <span class="font-weight-bold">{{ dest.name }}</span>
            </div>
            <div class="grey--text title">
              {{ statusMessage }}
            </div>
          </div>
        </v-card-title>
      </slot>
      <v-progress-linear
        v-if="uploading"
        :value="totalProgressPercent"
        :indeterminate="indeterminate"
        height="20"
      />
      <v-card-actions v-show="files.length && !errorMessage && !uploading">
        <v-btn
          text="text"
          @click="reset"
        >
          Clear all
        </v-btn>
        <v-btn
          v-if="!hideStartButton"
          color="primary"
          @click="startUpload"
        >
          {{ startButtonText }}
        </v-btn>
      </v-card-actions>
      <v-slide-y-reverse-transition hide-on-leave>
        <v-col v-if="!files.length">
          <slot
            name="dropzone"
            v-bind="{ files, dropzoneMessage, multiple, accept, inputFilesChanged }"
          >
            <dropzone
              :message="dropzoneMessage"
              :multiple="multiple"
              :accept="accept"
              @change="inputFilesChanged"
            />
          </slot>
        </v-col>
      </v-slide-y-reverse-transition>
      <div v-if="errorMessage">
        <v-alert
          :value="true"
          dark="dark"
          tile="tile"
          type="error"
        >
          {{ errorMessage }}
          <v-btn
            v-if="!uploading"
            class="ml-3"
            dark="dark"
            small="small"
            outlined="outlined"
            @click="startUpload"
          >
            Resume upload
          </v-btn>
          <v-btn
            v-if="!uploading"
            class="ml-3"
            dark="dark"
            small="small"
            outlined="outlined"
            @click="reset"
          >
            Abort
          </v-btn>
        </v-alert>
      </div>
      <slot
        v-bind="{ files, setFiles, maxShow }"
        name="files"
      >
        <v-slide-y-transition hide-on-leave>
          <file-upload-list
            v-if="files.length"
            v-bind="{ value: files, maxShow }"
            :style="{overflow: 'scroll'}"
            @input="setFiles"
          />
        </v-slide-y-transition>
      </slot>
    </v-row>
  </v-card>
</template>

<script>
import { progressReporter, sizeFormatter, fileUploader } from '../utils/mixins';
import Dropzone from './Presentation/Dropzone.vue';
import FileUploadList from './Presentation/FileUploadList.vue';
import Upload from '../utils/upload';

export default {
  components: {
    Dropzone,
    FileUploadList,
  },
  mixins: [fileUploader, progressReporter, sizeFormatter],
  inject: ['girderRest'],
  props: {
    dest: {
      required: true,
      type: Object,
    },
    maxShow: {
      default: 0,
      type: Number,
    },
    multiple: {
      default: true,
      type: Boolean,
    },
    preUpload: {
      default: () => {},
      type: Function,
    },
    postUpload: {
      default: () => {},
      type: Function,
    },
    uploadCls: {
      default: Upload,
      type: Function,
    },
    accept: {
      default: null,
      type: String,
    },
    startButtonText: {
      default: 'Start Upload',
      type: String,
    },
    hideStartButton: {
      default: false,
      type: Boolean,
    },
    hideHeadline: {
      default: false,
      type: Boolean,
    },
  },
  data: () => ({
    dragover: false,
  }),
  computed: {
    dropzoneMessage() {
      if (this.multiple) {
        return 'Drag files here or click to select them';
      }
      return 'Drag a file here or click to select one';
    },
    statusMessage() {
      if (this.uploading) {
        return `${this.formatSize(this.totalProgress)} / ${this.formatSize(this.totalSize)} `
          + `(${this.totalProgressPercent}%)`;
      }
      return `${this.files.length} selected (${this.formatSize(this.totalSize)} total)`;
    },
  },
  methods: {
    startUpload() {
      const {
        dest, uploadCls, preUpload, postUpload,
      } = this;
      this.start({
        dest, uploadCls, preUpload, postUpload,
      }).catch(() => {});
    },
  },
};
</script>
