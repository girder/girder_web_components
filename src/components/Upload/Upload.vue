<script>
import { computed, inject } from 'vue';
import Dropzone from './Dropzone.vue';
import FileUploadList from './UploadFileList.vue';

import { usefileUploader } from '@/composables';
import { UploadManager, formatSize } from '@/utils';

export default {
  name: 'GirderUpload',

  components: {
    Dropzone,
    FileUploadList,
  },
  
  props: {
    dest: { required: true, type: Object },
    maxShow: { type: Number, default: 0 },
    multiple: { type: Boolean, default: true },
    preUpload: { type: Function, default: () => {} },
    postUpload: { type: Function, default: () => {} },
    uploadCls: { type: Function, default: UploadManager },
    accept: { type: String, default: null },
    startButtonText: { type: String, default: "Start Upload" },
    hideStartButton: { type: Boolean, default: false },
    hideHeadline: { type: Boolean, default: false },
  },
  
  emits: ['filesChanged', 'error', 'done'],

  setup(props, ctx) {
    // ---- Injected client ----
    const { rest } = inject("girder");

    // ---- Composable ----
    const {
      files,
      uploading,
      indeterminate,
      errorMessage,
      totalProgress,
      totalSize,
      totalProgressPercent,
      reset,
      inputFilesChanged,
      setFiles,
      start,
    } = usefileUploader({
      girderRest: rest,
      onFilesChanged: (files) => ctx.emit('filesChanged', files),
      onError: (err) => ctx.emit('error', err),
      onDone: (results) => ctx.emit('done', results),
    });

    // ---- Computed ----
    const dropzoneMessage = computed(() =>
      props.multiple
        ? 'Drag files here or click to select them'
        : 'Drag a file here or click to select one'
    );

    const statusMessage = computed(() => {
      if (uploading) {
        return `${formatSize(totalProgress)} / ${formatSize(totalSize)} (${formatSize(totalProgressPercent)}%)`;
      }
      return `${files.length} selected (${formatSize(totalSize)} total)`;
    });

    function startUpload() {
      start({
        dest: props.dest,
        uploadCls: props.uploadCls,
        preUpload: props.preUpload,
        postUpload: props.postUpload,
      }).catch(() => {});
    }

    return {
      files,
      uploading,
      indeterminate,
      errorMessage,
      totalProgressPercent,
      reset,
      inputFilesChanged,
      dropzoneMessage,
      statusMessage,
      setFiles,
      startUpload,
    };
  },
};
</script>

<template>
  <v-card>
    <slot name="header">
      <v-card-title>
        <div
          v-if="!hideHeadline"
          class="headline"
        >
          Upload to <span class="font-weight-bold">{{ dest.name }}</span>
        </div>
        <div v-if="uploading">
          {{ statusMessage }}
        </div>
        <v-progress-linear
          v-if="uploading"
          :value="totalProgressPercent"
          :indeterminate="indeterminate"
          height="20"
        />
      </v-card-title>
    </slot>
    <v-card-text style="height: 250px">
      <slot
        name="dropzone"
        v-bind="{ files, dropzoneMessage, multiple, accept, inputFilesChanged }"
      >
        <dropzone
          v-if="!files.length"
          :message="dropzoneMessage"
          :multiple="multiple"
          :accept="accept"
          @change="inputFilesChanged"
        />
      </slot>
      <slot
        v-bind="{ files, setFiles, maxShow }"
        name="files"
      >
        <file-upload-list
          v-if="files.length"
          v-bind="{ files, maxShow }"
          @input="setFiles"
        />
      </slot>
    </v-card-text>
    <v-card-actions
      v-if="files.length && !uploading"
      class="pa-4"
    >
      <div
        v-if="!errorMessage"
        class="d-flex flex-grow-1"
      >
        <v-spacer />
        <v-btn
          text="Clear all"
          rounded
          @click="reset"
        />
        <v-btn
          v-if="!hideStartButton"
          color="primary"
          rounded
          :text="startButtonText"
          @click="startUpload"
        />
      </div>
      <v-alert
        v-else
        type="error"
        title="Error"
        :text="errorMessage"
      >
        <template #append>
          <v-spacer />
          <v-btn
            text="Resume Upload"
            @click="startUpload"
          />
          <v-btn
            text="Abort"
            @click="reset"
          />
        </template>
      </v-alert>
    </v-card-actions>
  </v-card>
</template>
