<template lang="pug">
.login-widget
  v-alert(
      dismissible,
      transition="scale-transition",
      v-for="err in alerts.errors",
      :key="err",
      :value="!!err",
      type="error") {{ err }}
  form(@submit.prevent="login", ref="login")
    v-container
      v-text-field(
          v-model="username",
          label="Username or e-mail",
          autofocus,
          :rules="nonEmptyRules",
          prepend-icon="$vuetify.icons.user",
          type="text")
      v-text-field(
          v-model="password",
          type="password",
          label="Password",
          :rules="nonEmptyRules",
          prepend-icon="$vuetify.icons.lock")
      .submit-area
        v-btn(type="submit",
            color="primary",
            :disabled="inProgress",
            :loading="inProgress")
          v-icon.aligned $vuetify.icons.login
          span &nbsp; Login
        v-btn(flat, color="primary", @click="forgotPasswordAction") Forgot Password?
  v-divider
  oauth(ref="oauth", :providers="oauthProviders")
</template>

<script>
import Oauth from './OAuth.vue';

export default {
  inject: ['girderRest'],
  props: {
    forgotPasswordUrl: {
      type: String,
      default: null,
    },
    forgotPasswordRoute: {
      type: Object,
      default: null,
    },
    oauthProviders: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    Oauth,
  },
  data() {
    return {
      username: '',
      password: '',
      inProgress: false,
      alerts: {
        errors: [],
      },
      nonEmptyRules: [
        v => !!v || 'Item is required',
      ],
    };
  },
  methods: {
    forgotPasswordAction() {
      if (this.forgotPasswordUrl) {
        window.location = this.forgotPasswordUrl;
      } else if (this.forgotPasswordRoute && '$router' in this) {
        this.$router.push(this.forgotPasswordRoute);
      } else {
        this.$emit('forgotpassword');
      }
    },
    async login() {
      this.inProgress = true;
      this.alerts.errors.length = 0;

      let resp;
      try {
        resp = await this.girderRest.login(this.username, this.password);
      } catch (err) {
        this.inProgress = false;
        if (!err.response || err.response.status !== 401) {
          throw err;
        } else {
          this.alerts.errors.length = 0;
          this.alerts.errors.push(err.response.data.message || 'Unknown error.');
        }
        return null;
      }
      this.inProgress = false;
      return resp;
    },
  },
};
</script>

<style lang="stylus" scoped>
.submit-area
  display flex
  justify-content space-between
  box-sizing border-box
</style>
