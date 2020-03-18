<template>
  <div class="login-widget">
    <v-alert
      v-for="err in alerts.errors"
      :key="err"
      :value="!!err"
      class="mt-0"
      dismissible="dismissible"
      transition="scale-transition"
      type="error">{{ err }}</v-alert>
    <v-container>
      <v-form
        ref="login"
        @submit.prevent="login">
        <v-text-field
          v-if="!otpFormVisible || forceOtp"
          v-model="username"
          :rules="nonEmptyRules"
          label="Username or e-mail"
          autofocus="autofocus"
          prepend-icon="$vuetify.icons.user"
          type="text"/>
        <v-text-field
          v-if="!otpFormVisible || forceOtp"
          v-model="password"
          :rules="nonEmptyRules"
          type="password"
          label="Password"
          prepend-icon="$vuetify.icons.lock"/>
        <v-text-field
          v-if="otpFormVisible || forceOtp"
          v-model="otp"
          :rules="otpRules"
          type="text"
          label="Authentication code"
          prepend-icon="$vuetify.icons.otp"/>
        <v-card-actions>
          <v-btn
            :disabled="inProgress"
            :loading="inProgress"
            class="ml-0"
            type="submit"
            color="primary">
            <v-icon left="left">$vuetify.icons.login</v-icon>
            {{ otpFormVisible ? 'Verify code' : 'Login' }}
          </v-btn><template v-if="!hideForgotPassword">
            <v-spacer/>
            <v-btn
              :to="forgotPasswordRoute"
              :href="forgotPasswordUrl"
              text="text"
              color="primary"
              @click="$emit('forgotpassword')">Forgot Password?</v-btn>
          </template>
        </v-card-actions>
      </v-form>
    </v-container><template v-if="oauthProviders && oauthProviders.length">
      <v-divider/>
      <girder-oauth :providers="oauthProviders"/>
    </template>
  </div>
</template>

<script>
import GirderOauth from './OAuth.vue';

// Magic substring that, if present, indicates a user must supply an OTP
const OTP_MAGIC_SUBSTRING = 'authentication must include a one-time password';

// Validation rules
const nonEmptyRules = [
  v => !!v || 'Item is required',
];
const otpRules = [
  (v) => {
    const phrase = '6 digit number';
    try {
      return (parseInt(v, 10) && String(v).length === 6) || phrase;
    } catch (err) {
      return phrase;
    }
  },
];

export default {
  inject: ['girderRest'],
  components: {
    GirderOauth,
  },
  props: {
    forceOtp: {
      type: Boolean,
      default: false,
    },
    forgotPasswordUrl: {
      type: String,
      default: null,
    },
    forgotPasswordRoute: {
      type: Object,
      default: null,
    },
    hideForgotPassword: {
      type: Boolean,
      default: false,
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
      nonEmptyRules,
      otpRules,
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
            this.otp = null;
            this.otpFormVisible = true;
            this.$refs.login.resetValidation();
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
