<script>
import { Upload } from '@/components';
import AuthorizedUpload from '@/utils/authorizedUpload';

export default {
  inject: ['girderRest'],
  components: { Upload },
  props: {
    id: {
      required: true,
      type: String,
    },
    authorization: {
      required: true,
      type: String,
    },
  },
  data: () => ({
    email: '',
    description: '',
    uploadCls: AuthorizedUpload,
  }),
  computed: {
    uploadDest() {
      return {
        id: this.id,
        authorization: this.authorization,
        description: this.description.trim(),
        email: this.email.trim(),
      };
    },
  },
  methods: {
    uploadDone() {
      const resp = this.girderRest.post(`authorized_uploads/${this.id}/completion`, {
        authorization: this.authorization,
      });
    }
  },
};
</script>

<template>
  <v-app class="app">
    <v-main>
      <v-container>
        <upload
          :dest="uploadDest"
          :uploadCls="uploadCls"
          @done="uploadDone"
        >
          <template #header="{ files, statusMessage }">
            <div v-show="files.length">{{ statusMessage }}</div>
          </template>
        </upload>
      </v-container>
    </v-main>
  </v-app>
</template>

<style lang="scss" scoped>
.app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
