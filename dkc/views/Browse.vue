<script>
import md from 'markdown-it';
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
    showTermsOfUse: false,
    termsOfUse: null,
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
      return this.$refs.browser.selected;
    },
    termsOfUseHtml() {
      if (this.termsOfUse) {
        return md({
          linkify: true,
        }).render(this.termsOfUse.text);
      }
      return '';
    }
  },
  watch: {
    async folder(val) {
      // This is triggered by events from the underlying component.
      if (val === null && this.folderId !== null) {
        this.$router.push('/folders');
      } else if (val !== null && this.folderId !== `${val.id}`) {
        this.$router.push(`/folders/${val.id}`);
      }

      if (this.folder && this.folder.parent === null) {
        try {
          await this.ensureTermsOfUseAgreement();
        } catch (e) {
          this.$router.push('/');
        }
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
    },
    async ensureTermsOfUseAgreement() {
      const resp = await this.girderRest.get(`folders/${this.folder.id}/terms/agreement`);
      if (resp.status === 204) {
        return;
      } else if (resp.status === 200) {
        const { text, checksum } = resp.data;
        this.showTermsOfUse = true;
        return new Promise((accept, decline) => {
          this.termsOfUse = {
            text,
            checksum,
            accept,
            decline,
          };
        });
      }
    },
    async acceptTermsOfUse() {
      if (this.girderRest.user) {
        await this.girderRest.post(
          `folders/${this.folder.id}/terms/agreement/${this.termsOfUse.checksum}`
        );
        // TODO we should catch the out-of-date error and guide the user to refresh.
      }
      this.showTermsOfUse = false;
      this.termsOfUse.accept();
    },
    declineTermsOfUse() {
      this.showTermsOfUse = false;
      this.termsOfUse.decline();
    },
  },
};
</script>

<template>
  <v-row>
    <v-dialog
      v-model="showTermsOfUse"
      max-width="700px"
      persistent
    >
      <v-card>
        <v-card-title>
          Terms of Use
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="py-2">
          <div v-html="termsOfUseHtml"></div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            text
            @click="declineTermsOfUse"
          >
            Decline
          </v-btn>
          <v-btn
            color="primary"
            @click="acceptTermsOfUse"
          >
            Accept
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
