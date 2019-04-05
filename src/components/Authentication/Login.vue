<template lang="pug">
.login-widget
  v-alert.mt-0(
      dismissible,
      transition="scale-transition",
      v-for="err in alerts.errors",
      :key="err",
      :value="!!err",
      type="error") {{ err }}
  v-container
    v-form(@submit.prevent="login", ref="login")
      v-text-field(
          v-if="!otpFormVisible",
          v-model="username",
          label="Username or e-mail",
          autofocus,
          :rules="nonEmptyRules",
          prepend-icon="$vuetify.icons.user",
          type="text")
      v-text-field(
          v-if="!otpFormVisible",
          v-model="password",
          type="password",
          label="Password",
          :rules="nonEmptyRules",
          prepend-icon="$vuetify.icons.lock")
      v-text-field(
          v-if="otpFormVisible",
          v-model="otp",
          type="text",
          mask="######",
          label="TOTP Token",
          prepend-icon="$vuetify.icons.otp")
      v-layout(row)
        v-btn.ml-0(type="submit",
            color="primary",
            :disabled="inProgress",
            :loading="inProgress")
          v-icon(left) $vuetify.icons.login
          | {{ otpFormVisible ? 'Verify code' : 'Login' }}
        v-spacer
        v-btn(
            flat, color="primary", :to="forgotPasswordRoute", :href="forgotPasswordUrl",
            @click="$emit('forgotpassword')") Forgot Password?
  template(v-if="oauthProviders && oauthProviders.length")
    v-divider
    girder-oauth(:providers="oauthProviders")
</template>

<script>
import GirderOauth from './OAuth.vue';

// Magic substring that, if present, indicates a user must supply an OTP
const OTP_MAGIC_SUBSTRING = 'authentication must include a one-time password';

export default {
  inject: ['girderRest'],
  components: {
    GirderOauth,
  },
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
  data() {
    return {
      username: '',
      password: '',
      otp: null,
      inProgress: false,
      alerts: {
        errors: [],
      },
      nonEmptyRules: [
        v => !!v || 'Item is required',
      ],
      otpFormVisible: false,
    };
  },
  methods: {
    async login() {
      if (!this.$refs.login.validate()) {
        return;
      }
      this.alerts.errors = [];
      this.inProgress = true;
      try {
        await this.girderRest.login(this.username, this.password, this.otp);
        this.password = '';
        this.otp = null;
        this.otpFormVisible = false;
      } catch (err) {
        if (!err.response || err.response.status !== 401) {
          this.alerts.errors.push('Unknown error.');
          throw err;
        } else {
          const { message } = err.response.data;
          if (message && message.indexOf(OTP_MAGIC_SUBSTRING) >= 0) {
            this.otpFormVisible = true;
          } else {
            this.alerts.errors.push(message || 'Unauthorized.');
          }
        }
      } finally {
        this.inProgress = false;
      }
    },
  },
};
</script>
