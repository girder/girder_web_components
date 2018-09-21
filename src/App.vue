<template lang="pug">
v-app#app
  girder-upload(v-if="folder" :dest="folder", :multiple="multiple")
  v-layout(v-else justify-center)
    v-flex(xs12 sm10 md8 lg6)
      girder-auth(
        :register="true"
        :oauth="true"
        :forgot-password-url="forgotPasswordUrl")
</template>

<script>
import {
  Upload as GirderUpload,
  Authentication as GirderAuth,
} from './components';

export default {
  name: 'app',
  inject: ['girderRest'],
  components: {
    GirderUpload,
    GirderAuth,
  },
  data() {
    return {
      error: null,
      folder: null,
      multiple: true,
      forgotPasswordUrl: `${this.girderRest.url.origin}/#?dialog=resetpassword`,
    };
  },
  methods: {
    _errMsgFromResp(response) {
      if (response) {
        this.error = response.data.message;
      } else {
        this.error = `Could not connect to server: ${this.girderRest.apiRoot}`;
      }
    },
    async fetchFolder() {
      try {
        [this.folder] = (await this.girderRest.get('folder', {
          params: {
            parentType: 'user',
            parentId: this.girderRest.user._id,
          },
        })).data;
      } catch ({ response }) {
        this._errMsgFromResp(response);
      }
    },
  },
  mounted() {
    if (this.girderRest.user) {
      this.fetchFolder();
    }
    this.girderRest.$on('login', () => {
      this.girderRest.fetchUser();
      this.fetchFolder();
    });
  },
};
</script>

<style lang="stylus">
.app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
</style>
