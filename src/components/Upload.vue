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

    v-progress-linear(v-if="uploading", :value="totalProgressPercent", height="20")

    v-card-actions(v-show="files.length && !errorMessage && !uploading")
      v-btn(text, @click="files = []") Clear all
      v-btn(text, color="primary", @click="start") Start upload

    v-col
      slot(name="dropzone")
        dropzone(v-if="!files.length",
            @change="filesChanged",
            :message="dropzoneMessage",
            :multiple="multiple",
            :accept="accept")

    div(v-if="errorMessage")
      v-alert(:value="true", dark, type="error") {{ errorMessage }}
        v-btn(v-if="!uploading", dark, outlined, @click="start") Resume upload

    slot(name="files")
      file-upload-list(v-model="files", v-bind="{ currentIndex, maxShow }")
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
  },
  data: () => ({
    dragover: false,
    errorMessage: null,
    files: [],
    uploading: false,
    currentIndex: 0,
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
      return this.files.reduce((v, f) => v + (f.progress.current), 0);
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
    filesChanged(files) {
      this.currentIndex = 0;
      this.files = files.map(file => ({
        file,
        status: 'pending',
        progress: {
          indeterminate: false,
          current: 0,
          size: file.size,
        },
        upload: null,
        result: null,
      }));
    },

    async start() {
      const results = [];
      this.uploading = true;
      this.errorMessage = null;
      await this.preUpload();
      for (; this.currentIndex < this.files.length; this.currentIndex += 1) {
        const file = this.files[this.currentIndex];
        if (file.status === 'done') {
          // We are resuming, skip already completed files
          results.push(file.result);
        } else {
          const progress = (event) => {
            Object.assign(file.progress, event);
          };
          file.status = 'uploading';
          file.progress.indeterminate = true;
          try {
            if (file.upload) {
              // eslint-disable-next-line no-await-in-loop
              file.result = await file.upload.resume();
            } else {
              // eslint-disable-next-line new-cap
              file.upload = new this.uploadCls(file.file, {
                $rest: this.girderRest,
                parent: this.dest,
                progress,
              });
              // eslint-disable-next-line no-await-in-loop
              await file.upload.beforeUpload();
              // eslint-disable-next-line no-await-in-loop
              file.result = await file.upload.start();
            }
            // eslint-disable-next-line no-await-in-loop
            await file.upload.afterUpload();
            delete file.upload;
            results.push(file.result);
            file.status = 'done';
            file.progress.current = file.file.size;
          } catch (error) {
            // eslint-disable-next-line no-await-in-loop
            await file.upload.onError(error);

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
