<script>
import { computed } from 'vue'
import { progressPercent, formatSize } from '@/utils';

export default {
  name: "GirderUploadFileList",

  props: {
    files: { type: Array, required: true },
    maxShow: { type: Number, default: 0 },
  },

  emits: ['input'],

  setup(props) {
    const notDone = computed(() =>
      props.files.filter((f) => f.status !== 'done')
    );
    const shownFiles = computed(() =>
      props.maxShow ? notDone.value.slice(0, props.maxShow) : props.files
    );
    const hiddenCount = computed(() => {
      return props.maxShow ? notDone.value.length - shownFiles.value.length : 0
    }

    );

    function splice(idx) {
      return [
        ...props.files.slice(0, idx),
        ...props.files.slice(idx + 1),
      ];
    }

    return {
      notDone,
      shownFiles,
      hiddenCount,
      formatSize,
      progressPercent,
      splice,
    }
  }
};
</script>

<template>
  <v-list class="files-list">
    <v-list-item
      v-for="(file, i) in shownFiles"
      :key="file.file.name"
      class="file-item"
    >
      <v-list-item-title>{{ file.file.name }}</v-list-item-title>
      <v-list-item-subtitle>
        <span v-if="file.progress.current">{{ formatSize(file.progress.current) }} /</span>
        <span>{{ formatSize(file.file.size) }}</span>
      </v-list-item-subtitle>
      <template #append>
        <v-icon
          v-if="file.status === 'pending'"
          v-tooltip="'Delete'"
          icon="$close"
          @click="$emit('input', splice(i))"
        />
        <v-icon
          v-if="file.status === 'error'"
          icon="$error"
          color="error"
        />
        <v-progress-circular
          v-if="file.status === 'uploading'"
          :rotate="-90"
          :value="progressPercent({ ...file.progress, total: file.progress.size })"
          :indeterminate="file.progress.indeterminate"
          color="primary"
        />
        <v-icon
          v-if="file.status === 'done'"
          color="success"
          icon="$complete"
        />
      </template>
      <slot
        v-bind="{ file }"
        name="item"
      />
    </v-list-item>
    <v-list-item v-if="hiddenCount">
      <div>
        + {{ hiddenCount }} more...
      </div>
    </v-list-item>
  </v-list>
</template>

<style lang="scss" scoped>
.files-list {
  max-width: 100%;
  overflow: auto;
  height: 100%;
}

.file-item {
  transition:
    width 0.8s ease-in-out 1s,
    height 0.8s ease-in-out 1s,
    background-color 0.5s ease-in-out;
  width: 100%;

  &.status-uploading {
    background-color: var(--v-highlight-base);
  }

  &.status-done {
    width: 0;
    height: 0;
    overflow: hidden;
  }
}
</style>
