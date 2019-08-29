<template lang="pug">
  v-list(v-show="value.length", dense)
    .file-tile(v-for="(file, i) in value", :key="file.file.name",
        :class="`status-${file.status}`")
      v-divider(v-if="i > 0")
      v-list-tile(avatar)
        v-list-tile-avatar
          v-btn(v-if="file.status === 'pending'", icon, @click="$emit('input', splice(i))")
            v-icon $vuetify.icons.values.close
          v-progress-circular(v-if="file.status === 'uploading'", color="primary",
              :rotate="-90", :value="progressPercent(file.progress)",
              :indeterminate="file.progress.indeterminate")
          v-icon(v-if="file.status === 'done'", color="success", large) $vuetify.icons.values.complete
          v-icon(v-if="file.status === 'error'", color="error", large) $vuetify.icons.values.error
        v-list-tile-content
          v-list-tile-title {{ file.file.name }}
          v-list-tile-sub-title
            span(v-if="file.progress.current") {{ formatSize(file.progress.current ) }} /
            = " "
            span {{ formatSize(file.file.size) }}
</template>

<script>
import { progressReporter, sizeFormatter } from '../../utils/mixins';

export default {
  mixins: [progressReporter, sizeFormatter],
  props: {
    value: {
      type: Array,
      required: true,
    },
  },
  methods: {
    splice(idx) {
      return [
        ...this.value.slice(0, idx),
        ...this.value.slice(idx + 1),
      ];
    },
  },
};
</script>

<style lang="scss" scoped>
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
