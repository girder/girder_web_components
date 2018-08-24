<template lang="pug">
v-app#app
  girder-upload(v-if="folder", :dest="folder", :closeable="closeable", :multiple="multiple")
  v-form.pa-4(v-if="!girderRest.user")
    v-text-field(v-model="username", label="Username or email")
    v-text-field(v-model="password", label="Password", type="password")
    v-alert(:value="error") {{ error }}
    v-btn(@click="login") Login
</template>

<script>
import GirderUpload from './components/Upload.vue';

export default {
  name: 'app',
  inject: ['girderRest'],
  components: { GirderUpload },
  data: () => ({
    closeable: false,
    error: null,
    folder: null,
    multiple: true,
    password: '',
    username: '',
  }),
  methods: {
    _errMsgFromResp(response) {
      if (response) {
        this.error = response.data.message;
      } else {
        this.error = `Could not connect to server: ${this.girderRest.apiRoot}`;
      }
    },
    async login() {
      this.error = null;

      try {
        await this.girderRest.login(this.username, this.password);
        this.username = '';
        this.password = '';
        await this.fetchFolder();
      } catch ({ response }) {
        this._errMsgFromResp(response);
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
  },
};
</script>

<style lang="stylus">
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
</style>
