<template lang="pug">
v-card.fill-height(flat)
  v-row.flex-column.fill-height(no-gutters)
    slot(name="header")
      v-card-title(primary-title)
        div
          .headline
            | Upload to
            = " "
            span.font-weight-bold {{ dest.name }}
          .grey--text.title {{ statusMessage }}

    v-progress-linear(
        v-if="uploading",
        :value="totalProgressPercent",
        :indeterminate="indeterminate",
        height="20")

    v-card-actions(v-show="files.length && !errorMessage && !uploading")
      v-btn(text, @click="reset") Clear all
      v-btn(text, color="primary", @click="startUpload") {{ startButtonText }}

    v-col
      slot(name="dropzone")
        dropzone(v-if="!files.length",
            @change="inputFilesChanged",
            :message="dropzoneMessage",
            :multiple="multiple",
            :accept="accept")

    div(v-if="errorMessage")
      v-alert(:value="true", dark, tile, type="error") {{ errorMessage }}
        v-btn.ml-3(
            v-if="!uploading",
            dark,
            small,
            outlined,
            @click="startUpload") Resume upload
        v-btn.ml-3(v-if="!uploading", dark, small, outlined, @click="reset") Abort

    slot(name="files", v-bind="{ files, setFiles, maxShow }")
      file-upload-list(@input="setFiles", v-bind="{ value: files, maxShow }")
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
        return `${this.formatSize(this.totalProgress)} / ${this.formatSize(this.totalSize)} ` +
          `(${this.totalProgressPercent}%)`;
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
