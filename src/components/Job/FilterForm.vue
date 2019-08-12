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
  v-container.py-2(fluid, grid-list-lg)
    v-layout(row)
      v-flex(sm12, d-flex)
        h3.subheading Girder Worker Jobs
    v-layout(row, justify-center)
      v-flex(sm3, d-flex)
        v-select(
            label="Job Type",
            :items="jobTypeList",
            :value="jobType",
            clearable,
            color="white",
            :menu-props="{'content-class':'girder-job-filter-form-menu'}",
            dark,
            dense,
            @input="$emit('update:jobType', $event ? $event : null)")
      v-flex(sm3, d-flex)
        v-select(
            label="Status",
            :items="statusItemList",
            :value="status",
            clearable,
            color="white",
            :menu-props="{'content-class':'girder-job-filter-form-menu'}",
            dark,
            dense,
            @input="$emit('update:status', $event ? $event : null)")
</template>

<style lang="scss">
.girder-job-filter-form-menu .v-list__tile--active.theme--light {
  color: black !important;
}
</style>
