<template lang="pug">
v-card(flat, height="100%")
  v-layout(column, fill-height)
    slot(name="header")
      v-card-title(primary-title)
        div
          .headline
            | Upload to
            = " "
            span.font-weight-bold {{ dest.name }}
          .grey--text {{ statusMessage }}

    v-progress-linear(v-if="uploading", :value="totalProgressPercent", height="20")

    v-card-actions(v-show="files.length && !errorMessage && !uploading")
      v-btn(flat, @click="files = []") Clear all
      v-btn(flat, color="primary", @click="start") Start upload

    slot(name="dropzone")
      dropzone(
          :files="files",
          :message="dropzoneMessage",
          :multiple="multiple",
          @change="filesChanged")

    div(v-if="errorMessage")
      v-alert(:value="true", dark, type="error") {{ errorMessage }}
        v-btn(v-if="!uploading", dark, outline, @click="start") Resume upload

    slot(name="files")
      file-upload-list(v-model="files")
</template>

<script>
import { progressReporter, sizeFormatter } from '../utils/mixins';
import Dropzone from './Presentation/Dropzone.vue';
import FileUploadList from './Presentation/FileUploadList.vue';
import Upload from '../utils/upload';

export default {
  components: {
    Dropzone,
    FileUploadList,
  },
  mixins: [progressReporter, sizeFormatter],
  inject: ['girderRest'],
  props: {
    dest: {
      required: true,
      type: Object,
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
  },
  data: () => ({
    dragover: false,
    errorMessage: null,
    files: [],
    uploading: false,
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
    totalProgress() {
      return this.files.reduce((v, f) => v + (f.progress.current || 0), 0);
    },
    totalSize() {
      return this.files.reduce((v, f) => v + f.file.size, 0);
    },
    totalProgressPercent() {
      return this.progressPercent({
        current: this.totalProgress,
        total: this.totalSize,
      });
    },
  },
  methods: {
    filesChanged({ target }) {
      this.files = [...target.files].map(file => ({
        file,
        status: 'pending',
        progress: {},
        upload: null,
        result: null,
      }));
    },

    async start() {
      const results = [];
      this.uploading = true;
      this.errorMessage = null;
      await this.preUpload();
      for (let i = 0; i < this.files.length; i += 1) {
        const file = this.files[i];
        if (file.status === 'done') {
          // We are resuming, skip already completed files
          results.push(file.result);
        } else {
          const progress = (event) => {
            file.progress = Object.assign({}, file.progress, event);
          };
          file.status = 'uploading';
          try {
            if (file.upload) {
              // eslint-disable-next-line no-await-in-loop
              file.result = await file.upload.resume();
            } else {
              file.upload = new Upload(this.girderRest, file.file, this.dest, { progress });
              // eslint-disable-next-line no-await-in-loop
              file.result = await file.upload.start();
            }
            delete file.upload;
            results.push(file.result);
            file.status = 'done';
          } catch (error) {
            if (error.response) {
              this.errorMessage = error.response.data.message || 'An error occurred during upload.';
            } else {
              this.errorMessage = 'Connection failed.';
            }
            file.status = 'error';
            this.uploading = false;
            this.$emit('error', { error, file });
            return;
          }
        }
      }
      await this.postUpload();
      this.uploading = false;
      this.files = [];
      this.$emit('done', results);
    },
  },
};
</script>
