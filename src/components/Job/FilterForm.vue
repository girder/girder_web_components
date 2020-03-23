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
        .filter((s) => s && s.text)
        .sort((a, b) => {
          if (a.text > b.text) {
            return 1;
          } if (a.text < b.text) {
            return -1;
          }
          return 0;
        });
    },
  },
};
</script>

<template>
  <v-card
    class="job-filter"
    dark="dark"
    color="primary"
  >
    <v-card-title>
      <v-container>
        <h4>Jobs</h4>
        <v-row justify="center">
          <v-col
            sm="5"
            md="4"
          >
            <v-select
              :items="jobTypeList"
              :value="jobType"
              :menu-props="{'content-class':'girder-job-filter-form-menu'}"
              label="Job Type"
              clearable="clearable"
              color="white"
              dense="dense"
              @input="$emit('update:jobType', $event ? $event : null)"
            />
          </v-col>
          <v-col
            sm="5"
            md="4"
          >
            <v-select
              :items="statusItemList"
              :value="status"
              :menu-props="{'content-class':'girder-job-filter-form-menu'}"
              label="Status"
              clearable="clearable"
              color="white"
              dense="dense"
              @input="$emit('update:status', $event ? $event : null)"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-title>
  </v-card>
</template>
