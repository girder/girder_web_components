<script>
import * as status from './status';

export default {
  props: {
    jobType: {
      type: [String, Object],
      default: null,
    },
    jobTypeList: {
      type: Array,
      default() {
        return [];
      },
    },
    status: {
      type: [Number, Object],
      default: null,
    },
    statusList: {
      type: Array,
      default() {
        return [];
      },
    },
  },
  data() {
    return {
      fromDateMenu: false,
      toDateMenu: false,
    };
  },
  computed: {
    statusItemList() {
      return this.statusList
        .map(status.getByValue)
        .filter(s => s && s.text)
        .sort((a, b) => {
          if (a.text > b.text) {
            return 1;
          } else if (a.text < b.text) {
            return -1;
          }
          return 0;
        });
    },
  },
};
</script>

<template lang="pug">
v-card.job-filter(dark, color="primary")
  v-card-title
    v-container
      h4 Girder Worker Jobs
      v-row(justify="center")
        v-col(sm=5, md=4)
          v-select(
              label="Job Type",
              :items="jobTypeList",
              :value="jobType",
              clearable,
              color="white",
              :menu-props="{'content-class':'girder-job-filter-form-menu'}",
              dense,
              @input="$emit('update:jobType', $event ? $event : null)")
        v-col(sm=5, md=4)
          v-select(
              label="Status",
              :items="statusItemList",
              :value="status",
              clearable,
              color="white",
              :menu-props="{'content-class':'girder-job-filter-form-menu'}",
              dense,
              @input="$emit('update:status', $event ? $event : null)")
</template>
