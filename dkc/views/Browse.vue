<script>
import { DataBrowser, DataDetails } from '@/components';

export default {
  components: {
    DataBrowser,
    DataDetails,
  },
  data: () => ({
    folder: null,
  }),
  computed: {
    detailsList() {
      if (this.$refs.browser && this.selected.length) {
        return this.selected;
      }
      if (this.folder) {
        return [this.folder];
      }
      return [];
    },
    selected() {
      // Made an alias for this since I'm not sure if this is the best way to get hold of it
      return this.$refs.browser.internalValue;
    }
  },
  methods: {
    handleAction(action) {
      if (action.id === 'delete') {
        if (this.selected.length === 0) {
          // User just deleted the current folder. Go up one level.
          this.$refs.browser.navigateToParentFolder();
        } else {
          this.$refs.browser.refresh();
        }
      }
    }
  },
  // TODO watch folder and update the route
};
</script>

<template>
  <v-row>
    <v-col
      lg="8"
      sm="12"
    >
      <data-browser
        ref="browser"
        :folder.sync="folder"
        :selectable="true"
      />
    </v-col>
    <v-col
      lg="4"
      sm="12"
    >
      <data-details
        :value="detailsList"
        @action="handleAction"
      />
    </v-col>
  </v-row>
</template>
