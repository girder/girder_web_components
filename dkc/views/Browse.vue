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
      // This is triggered by events from the underlying component.
      if (val === null && this.folderId !== null) {
        this.$router.push('/folders');
      } else if (val !== null && this.folderId !== `${val.id}`) {
        this.$router.push(`/folders/${val.id}`);
      }
    },
    async folderId(val) {
      // This is triggered by route changes.
      if (val === null && this.folder) {
        this.folder = null;
        this.$refs.browser.breadcrumbs = [];
      } else if (val !== null && (this.folder === null || `${this.folder.id}` !== val)) {
        // First look in the breadcrumbs and see if the folder is already in there.
        // If it is, we don't need to hit the server.
        const bcs = this.$refs.browser.breadcrumbs;
        for (let i = 0; i < bcs.length; i += 1) {
          const bc = bcs[i];
          if (`${bc.id}` === val) {
            this.folder = bc;
            bcs.splice(i + 1);
            break;
          }
        }
        if (this.folder === null || `${this.folder.id}` !== val) {
          // This means it wasn't found in the breadcrumbs. Must fetch it.
          const [folderReq, breadcrumbReq] = await Promise.all([
            this.girderRest.get(`folders/${val}`),
            this.girderRest.get(`folders/${val}/path`),
          ]);
          this.folder = folderReq.data;
          this.$refs.browser.breadcrumbs = breadcrumbReq.data;
        }
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
