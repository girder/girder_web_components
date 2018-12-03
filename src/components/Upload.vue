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
      .dropzone-wrapper(
          v-if="!files.length", :class="dropzoneClass", @dragenter="dropzoneClass = 'animate'",
          @dragleave="dropzoneClass = null", @drop="dropzoneClass = null")
        v-layout.dropzone-message(column, justify-center, align-center, fill-height)
          v-icon(size="50px") $vuetify.icons.fileUpload
          .title.mt-3 {{ dropzoneMessage }}
        input.file-input(type="file", :multiple="multiple", @change="filesChanged")

    div(v-if="errorMessage")
      v-alert(:value="true", dark, type="error") {{ errorMessage }}
        v-btn(v-if="!uploading", dark, outline, @click="start") Resume upload

    slot(name="files")
      v-list(v-show="files.length", dense)
        .file-tile(v-for="(file, i) in files", :key="file.file.name",
            :class="`status-${file.status}`")
          v-divider(v-if="i > 0")
          v-list-tile(avatar)
            v-list-tile-avatar
              v-btn(v-if="file.status === 'pending'", icon, @click="files.splice(i, 1)")
                v-icon $vuetify.icons.close
              v-progress-circular(v-if="file.status === 'uploading'", color="primary",
                  :rotate="-90", :value="progressPercent(file.progress)",
                  :indeterminate="file.progress.indeterminate")
              v-icon(v-if="file.status === 'done'", color="success", large) $vuetify.icons.complete
              v-icon(v-if="file.status === 'error'", color="error", large) $vuetify.icons.error
            v-list-tile-content
              v-list-tile-title {{ file.file.name }}
              v-list-tile-sub-title
                span(v-if="file.progress.current") {{ formatSize(file.progress.current ) }} /
                = " "
                span {{ formatSize(file.file.size) }}
</template>

<script>
import { sizeFormatter } from '../utils/mixins';
import Upload from '../utils/upload';

export default {
  mixins: [sizeFormatter],
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
    dropzoneClass: null,
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
    progressPercent(progress) {
      if (!progress.total) {
        return 0;
      }
      return Math.round((100 * (progress.current || 0)) / progress.total);
    },
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

<style lang="scss" scoped>
$stripeColor: #f0f0f3;
$img: linear-gradient(
  -45deg,
  $stripeColor 25%,
  transparent 25%,
  transparent 50%,
  $stripeColor 50%,
  $stripeColor 75%,
  transparent 75%,
  transparent
);

.dropzone-wrapper {
  position: relative;
  cursor: pointer;
  min-height: 260px;
  height: 100%;
  background-color: #f6f6f9;
  background-repeat: repeat;
  background-size: 30px 30px;

  &:hover {
    background-image: $img;
  }

  &.animate {
    animation: stripes 2s linear infinite;
    background-image: $img;
  }

  .dropzone-message {
    position: absolute;
    width: 100%;
  }

  .file-input {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;
    opacity: 0;
    z-index: 1;
    cursor: pointer;
  }
}

@keyframes stripes {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 30px 60px;
  }
}

.file-tile {
  transition:
    width 0.8s ease-in-out 1s,
    height 0.8s ease-in-out 1s,
    background-color 0.5s ease-in-out;
  width: 100%;
  height: 100%;

  &.status-uploading {
    background-color: #fef4c9;
  }

  &.status-done {
    width: 0;
    height: 0;
    overflow: hidden;
  }
}
</style>
