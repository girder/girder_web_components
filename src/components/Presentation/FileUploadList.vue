<template>
  <v-list
    v-show="value.length"
    dense="dense"
    class="files-list"
  >
    <div
      v-for="(file, i) in shownFiles"
      :key="file.file.name"
      :class="`status-${file.status}`"
      class="file-tile"
    >
      <v-divider v-if="i > 0" />
      <v-list-item>
        <v-list-item-icon>
          <v-btn
            v-if="file.status === 'pending'"
            icon="icon"
            @click="$emit('input', splice(i))"
          >
            <v-icon>$vuetify.icons.close</v-icon>
          </v-btn>
          <v-progress-circular
            v-if="file.status === 'uploading'"
            :rotate="-90"
            :value="progressPercent({...file.progress, total: file.progress.size })"
            :indeterminate="file.progress.indeterminate"
            color="primary"
          />
          <v-icon
            v-if="file.status === 'done'"
            color="success"
            large="large"
          >
            $vuetify.icons.complete
          </v-icon>
          <v-icon
            v-if="file.status === 'error'"
            color="error"
            large="large"
          >
            $vuetify.icons.error
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ file.file.name }}</v-list-item-title>
          <v-list-item-subtitle>
            <span v-if="file.progress.current">{{ formatSize(file.progress.current ) }} /</span>
            <span>{{ formatSize(file.file.size) }}</span>
          </v-list-item-subtitle>
        </v-list-item-content>
        <slot
          v-bind="{ file }"
          name="item"
        />
      </v-list-item>
    </div><template v-if="hiddenCount">
      <v-divider />
      <v-list-item>
        <v-list-item-content>
          <div class="grey--text subtitle-1">
            + {{ hiddenCount }} more...
          </div>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-list>
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
  },
  computed: {
    notDone() {
      return this.value.filter((f) => f.status !== 'done');
    },
    shownFiles() {
      if (this.maxShow) {
        return this.notDone.slice(0, this.maxShow);
      }
      return this.value;
    },
    hiddenCount() {
      if (this.maxShow) {
        return this.notDone.length - this.shownFiles.length;
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
.files-list {
  max-width: 100%;
}

.file-tile {
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
