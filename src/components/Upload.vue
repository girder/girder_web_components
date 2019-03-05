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
      dropzone(v-if="!files.length",
          @change="filesChanged",
          :message="dropzoneMessage",
          :multiple="multiple")

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
    upload: {
      default: undefined,
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
    filesChanged(files) {
      this.files = files.map(file => ({
        file,
        status: 'pending',
        progress: {},
        upload: null,
        result: null,
      }));
    },

    /**
     * @param files the files to upload
     * @returns {results, err: {error, file, message}}
     */
    async _upload(files) {
      const results = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
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
            let message = '';
            if (error.response) {
              message = error.response.data.message || 'An error occurred during upload.';
            } else {
              message = 'Connection failed.';
            }
            file.status = 'error';
            return { results: null, err: { error, file, message } };
          }
        }
      }
      return { results, err: null };
    },

    async start() {
      this.uploading = true;
      this.errorMessage = null;

      await this.preUpload();

      const { results, err } = this.upload !== undefined
        ? await this.upload(this.files)
        : await this._upload(this.files);

      this.uploading = false;

      if (err !== null) {
        this.errorMessage = err.message;
        this.$emit('error', err);
      } else {
        await this.postUpload();
        this.files = [];
        this.$emit('done', results);
      }
    },
  },
};
</script>
