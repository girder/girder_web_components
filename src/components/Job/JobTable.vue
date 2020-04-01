<script>
import { jobFormatter } from '../../utils/mixins';
import JobProgress from './JobProgress.vue';

export const defaultHeaders = [{
  text: 'Job Title',
  value: 'title',
}, {
  text: 'Type',
  value: 'type',
}, {
  text: 'Last Updated',
  value: 'updated',
}, {
  text: 'Status',
  value: 'status',
}];

export default {
  components: { JobProgress },
  mixins: [jobFormatter],
  props: {
    jobs: {
      type: Array,
      required: true,
    },
    options: {
      type: Object,
      required: true,
    },
    morePages: {
      type: Boolean,
      default: true,
    },
    headers: {
      type: Array,
      default: () => defaultHeaders,
    },
  },
  computed: {
    items() {
      return this.jobs.map(this.formatJob);
    },
    serverItemsLength() {
      let { last } = this.pageRange;
      if (this.morePages) {
        last += 1;
      }
      return last;
    },
    pageRange() {
      const first = (this.options.itemsPerPage * (this.options.page - 1)) + 1;
      const last = (first + this.jobs.length) - 1;
      return { first, last };
    },
  },
};
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :server-items-length="serverItemsLength"
    :options="options"
    item-key="_id"
    @update:options="$emit('update:options', $event)"
  >
    <template #item="props">
      <slot
        v-bind="props"
        name="jobrow"
      >
        <tr @click="$emit('job-click', $event, props.item)">
          <td class="one-line">
            {{ props.item.title }}
          </td>
          <td class="one-line">
            {{ props.item.type }}
          </td>
          <td class="one-line">
            {{ props.item.updateString }}
          </td>
          <td
            :title="props.item.statusText"
            class="one-line"
            nowrap="nowrap"
          >
            <job-progress :formatted-job="props.item" />
          </td>
        </tr>
      </slot>
    </template>
    <template #footer.page-text="">
      <div class="v-datatable__actions__options">
        {{ pageRange.first }}-{{ pageRange.last }}
      </div>
    </template>
  </v-data-table>
</template>

<style lang="scss" scoped>
.one-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
