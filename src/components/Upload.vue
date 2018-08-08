<template lang="pug">
.upload-wrapper
  slot(name="toolbar")
    v-toolbar(dense, dark, color="success")
      v-toolbar-title Upload
      v-spacer
      v-btn(v-if="closeable", icon, flat, @click="$emit('close')")
        v-icon close
  .px-0.py-2
    slot(name="header")
      .title.px-3
        v-avatar.mr-2(color="blue-grey lighten-4")
          v-icon {{ ResourceIcons[parent._modelType.toUpperCase()] }}
        span {{ parent.name }}

  slot(name="dropzone")
    .dropzone-wrapper(
        v-if="!files.length", :class="dropzoneClass", @dragenter="dropzoneClass = 'animate'",
        @dragleave="dropzoneClass = null", @drop="dropzoneClass = null")
      .dropzone-message
        v-icon(size="50px") attach_file
        .title.mt-3 {{ dropzoneMessage }}
      input.file-input(type="file", :multiple="multiple", @change="filesChanged")

  .pb-2.px-3(v-show="files.length && !errorMessage")
    div(v-show="!uploading")
      v-subheader {{ statusMessage }}
      v-btn(color="warning", @click="files = []")
        v-icon.mr-1 close
        | Clear all
      v-btn(color="success", @click="start")
        v-icon.mr-1 play_arrow
        | Start upload

  div(v-if="errorMessage")
    v-alert(:value="true", type="error")
      span.body-2.mr-2 {{ errorMessage }}
      v-btn(v-if="!uploading", color="purple darken-1", dark, @click="start")
        v-icon.mr-1 replay
        | Resume upload

  slot(name="progress")
    div(v-if="uploading")
      .subheading.px-3.
        {{ formatSize(totalProgress) }} / {{ formatSize(totalSize) }} ({{ totalProgressPercent }}%)
      v-progress-linear(:value="totalProgressPercent", height="20")

  slot(name="files")
    v-list.file-list.pb-4(v-show="files.length", dense)
      v-list-tile.file-tile(v-for="(file, i) in files", :key="file.file.name", avatar,
          :class="`status-${file.status}`")
        v-list-tile-avatar
          v-btn.mx-0(v-if="file.status === 'pending'", icon, @click="files.splice(i, 1)")
            v-icon close
          v-progress-circular(v-if="file.status === 'uploading'", color="primary", :rotate="-90",
              :value="progressPercent(file.progress)", :indeterminate="file.progress.indeterminate")
          v-icon(v-if="file.status === 'done'", color="success", large) check
          v-icon(v-if="file.status === 'error'", color="error", large) warning
        v-list-tile-content
          v-list-tile-title {{ file.file.name }}
          v-list-tile-sub-title
            span(v-if="file.progress.current") {{ formatSize(file.progress.current ) }} /&nbsp;
            span {{ formatSize(file.file.size) }}
</template>

<script>
import { sizeFormatter } from '../utils/mixins';
import { ResourceIcons } from '../constants';
import Upload from '../utils/upload';

export default {
  mixins: [sizeFormatter],
  inject: ['girderRest'],
  props: {
    closeable: {
      default: false,
      type: Boolean,
    },
    multiple: {
      default: true,
      type: Boolean,
    },
    parent: {
      required: true,
      type: Object,
    },
  },
  data: () => ({
    dragover: false,
    dropzoneClass: null,
    errorMessage: null,
    files: [],
    uploading: false,
    ResourceIcons,
  }),
  computed: {
    dropzoneMessage() {
      if (this.multiple) {
        return 'Drag files here or click to select them';
      }
      return 'Drag a file here or click to select one';
    },
    statusMessage() {
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
              file.upload = new Upload(this.girderRest, file.file, this.parent, { progress });
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

      this.uploading = false;
      this.files = [];
      this.$emit('done', results);
    },
  },
};
</script>

<style lang="stylus" scoped>
$stripeColor = #f0f0f3
$img = linear-gradient(
  -45deg, $stripeColor 25%, transparent 25%, transparent 50%, $stripeColor 50%,
  $stripeColor 75%, transparent 75%, transparent)

.dropzone-wrapper
  position relative
  cursor pointer
  min-height 260px
  height 100%
  text-align center
  background-color #f6f6f9
  background-repeat repeat
  background-size 30px 30px

  &:hover
    background-image $img

  &.animate
    animation stripes 2s linear infinite
    background-image $img

  .file-input
    position absolute
    top 0
    right 0
    bottom 0
    left 0
    height 100%
    width 100%
    opacity 0
    z-index 1
    cursor pointer

@keyframes stripes
  from
    background-position 0 0
  to
    background-position 30px 60px

.dropzone-message
  position absolute
  left 50%
  top 50%
  transform translateX(-50%) translateY(-50%)

.file-tile
  background-color transparent
  transition width 0.8s ease-in-out 1s, height 0.8s ease-in-out 1s, background .5s ease-in-out
  width 100%
  height 100%

  &.status-uploading
    background-color #fef4c9

  &.status-done
    width 0
    height 0
    overflow hidden

.upload-wrapper
  display flex
  flex-direction column
  height 100%
</style>
