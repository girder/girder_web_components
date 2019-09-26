<template lang="pug">
  v-list(v-show="value.length", dense)
    .file-tile(v-for="(file, i) in shownFiles", :key="file.file.name",
        :class="`status-${file.status}`")
      v-divider(v-if="i > 0")
      v-list-item
        v-list-item-icon
          v-btn(v-if="file.status === 'pending'", icon, @click="$emit('input', splice(i))")
            v-icon $vuetify.icons.close
          v-progress-circular(v-if="file.status === 'uploading'",
              color="primary",
              :rotate="-90",
              :value="progressPercent({...file.progress, total: file.progress.size })",
              :indeterminate="file.progress.indeterminate")
          v-icon(v-if="file.status === 'done'", color="success", large) $vuetify.icons.complete
          v-icon(v-if="file.status === 'error'", color="error", large) $vuetify.icons.error
        v-list-item-content
          v-list-item-title {{ file.file.name }}
          v-list-item-subtitle
            span(v-if="file.progress.current") {{ formatSize(file.progress.current ) }} /
            = " "
            span {{ formatSize(file.file.size) }}
        slot(name="item", v-bind="{ file }")
    template(v-if="hiddenCount")
      v-divider
      v-list-item
        v-list-item-content
          .grey--text.subtitle-1 + {{ hiddenCount }} more...
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
    maxShow: {
      type: Number,
      default: 0,
    },
    currentIndex: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    shownFiles() {
      if (this.maxShow) {
        return this.value.slice(this.currentIndex, this.maxShow + this.currentIndex);
      }
      return this.value;
    },
    hiddenCount() {
      if (this.maxShow) {
        return Math.max(this.value.length - this.maxShow - this.currentIndex, 0);
      }
      return 0;
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
