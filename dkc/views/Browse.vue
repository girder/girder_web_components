<script>
import { DataBrowser, DataDetails } from '@/components';

export default {
  components: {
    DataBrowser,
    DataDetails,
  },
  inject: ['girderRest'],
  props: {
    folderId: {
      type: String, // comes in from the router, so it's always a string
      default: null,
    },
  },
  data: () => ({
    fetchedBreadcrumbs: [],
    folder: null,
    initialized: false,
  }),
  async created() {
    if (this.folderId === null) {
      this.initialized = true;
    } else {
      const [folderReq, breadcrumbReq] = await Promise.all([
        this.girderRest.get(`folders/${this.folderId}`),
        this.girderRest.get(`folders/${this.folderId}/path`),
      ]);
      this.folder = folderReq.data;
      this.fetchedBreadcrumbs = breadcrumbReq.data;
      this.initialized = true;
    }
  },
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
  watch: {
    folder(val) {
      if (val === null) {
        this.$router.push('/folders');
      } else {
        const route = val ? `/folders/${val.id}` : '/folders';
        this.$router.push(route);
      }
    },
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
};
</script>

<template>
  <v-row>
    <v-col
      lg="8"
      sm="12"
    >
      <data-browser
        v-if="initialized"
        ref="browser"
        :folder.sync="folder"
        :selectable="true"
        :initial-breadcrumbs="fetchedBreadcrumbs"
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
