<script>
import moment from 'moment';
import * as status from './status';

export default {
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
  },
  data() {
    return {
      headers: [{
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
      }],
    };
  },
  computed: {
    items() {
      return this.jobs.map(this.mapJobToRow);
    },
    headers_() {
      const widgetHeader = {
        sortable: false,
        align: 'end',
      };
      return this.headers.concat(this.$scopedSlots.jobwidget ? widgetHeader : []);
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
  methods: {
    mapJobToRow(job) {
      const statusDef = Object.assign({ text: 'Unknown' }, status.getByValue(job.status));
      return Object.assign({
        statusText: statusDef.text,
        statusColor: statusDef.color,
        statusTextColor: statusDef.textColor || 'white',
        statusIcon: statusDef.icon,
        updateString: moment(job.updated).format('dddd, MMMM D, YYYY @ h:mm a'),
        progressNumber: this.progressAsNumber(job.progress),
        indeterminate: statusDef.indeterminate,
        spin: statusDef.spin,
      }, job);
    },
    progressAsNumber(progress) {
      if (!progress) {
        return 100;
      }
      return 100 * (progress.current / progress.total);
    },
  },
};
</script>

<template lang="pug">
v-data-table(
    light,
    item-key="_id",
    :headers="headers_",
    :items="items",
    :server-items-length="serverItemsLength",
    :options="options",
    @update:options="$emit('update:options', $event)")
  template(#item="props")
    tr(@click="$emit('job-click', $event, props.item)")
      td.one-line {{ props.item.title }}
      td.one-line {{ props.item.type }}
      td.one-line {{ props.item.updateString }}
      td.one-line.status-line(nowrap, :title="props.item.statusText", width="1%")
        v-row.flex-nowrap.ma-2(align="center")
          v-progress-linear.progress-bar.mr-3(
              :color="props.item.statusColor",
              :value="props.item.progressNumber",
              :indeterminate="!!props.item.indeterminate",
              height="10")
          v-icon.status-icon(
              :color="props.item.statusColor",
              :class="{ rotate: props.item.spin }",
              :size="20") {{ props.item.statusIcon }}
      td.one-line.pa-0
        slot(name="jobwidget", v-bind="props")
  template(#pageText="")
    .v-datatable__actions__options {{ pageRange.first }}-{{ pageRange.last }}
</template>

<style lang="scss" scoped>
.one-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-line {
  .progress-bar {
    width: 150px;
  }
}

.rotate {
  animation: rotation 1.5s infinite linear;

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(359deg);
    }
  }
}
</style>
