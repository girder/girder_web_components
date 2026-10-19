<script>
import { ref } from "vue";
import GirderOauth from "./OAuth.vue";
import useGirderLogin from "@/composables/login";

export default {
  name: "GirderLogin",

  components: { GirderOauth },

  props: {
    forceOtp: { type: Boolean, default: false },
    forgotPasswordUrl: { type: String, default: null },
    forgotPasswordRoute: { type: Object, default: null },
    hideForgotPassword: { type: Boolean, default: false },
    oauthProviders: { type: Array, default: () => [] }
  },

  emits: ['forgotPassword'],

  setup() {
    const auth = useGirderLogin();

    const loginForm = ref(null);

    // ---- Validation rules ----
    const nonEmptyRules = [
      (v) => !!v || "Item is required",
    ];

    const otpRules = [
      (v) => {
        const phrase = "6 digit number";
        return (parseInt(v, 10) && String(v).length === 6) || phrase;
      },
    ];

    // ---- Methods ----
    const login = async () => {
      // Vuetify 3 resolves validate() to { valid, errors }
      const { valid } = await loginForm.value.validate();
      if (!valid) {return;}

      const result = await auth.login();
      if (result === "otp") {
        loginForm.value.resetValidation();
      }
    };

    return {
      username: auth.username,
      password: auth.password,
      otp: auth.otp,
      otpFormVisible: auth.otpRequired,
      requiresEmailVerification: auth.requiresEmailVerification,
      inProgress: auth.inProgress,
      alerts: auth.alerts,
      loginForm,
      nonEmptyRules,
      otpRules,
      login,
      sendVerification: auth.sendVerification,
    };
  },
};
</script>

<template>
  <div class="login-widget">
    <v-container>
      <v-alert
        v-if="!!alerts.error"
        type="error"
        variant="tonal"
        closable
        class="mt-0"
        :text="alerts.error"
      >
        <v-spacer />
        <v-btn
          v-if="requiresEmailVerification"
          size="small"
          variant="outlined"
          text="Resend verification email"
          @click="sendVerification"
        />
      </v-alert>
      <v-alert
        v-if="alerts.success"
        type="success"
        variant="tonal"
        closable
        class="mt-0"
        :text="alerts.success"
      />

      <!-- Login Form -->
      <v-form
        ref="loginForm"
        @submit.prevent="login"
      >
        <v-text-field
          v-if="!otpFormVisible || forceOtp"
          v-model="username"
          :rules="nonEmptyRules"
          variant="solo-filled"
          flat
          label="Username or e-mail"
          autocomplete="username"
          prepend-inner-icon="mdi-account"
        />

        <v-text-field
          v-if="!otpFormVisible || forceOtp"
          v-model="password"
          :rules="nonEmptyRules"
          variant="solo-filled"
          flat
          label="Password"
          type="password"
          autocomplete="current-password"
          prepend-inner-icon="mdi-lock"
        />

        <v-text-field
          v-if="otpFormVisible || forceOtp"
          v-model="otp"
          :rules="otpRules"
          variant="solo-filled"
          type="text"
          label="Authentication code"
          prepend-inner-icon="mdi-shield-key"
        />

        <div class="d-flex">
          <v-btn
            :loading="inProgress"
            :disabled="inProgress"
            type="submit"
            color="primary"
            rounded
            prepend-icon="$login"
            :text="otpFormVisible ? 'Verify code' : 'Login'"
            variant="flat"
          />
          <v-spacer />
          <template v-if="!hideForgotPassword">
            <v-spacer />
            <v-btn
              :to="forgotPasswordRoute"
              :href="forgotPasswordUrl"
              variant="text"
              color="primary"
              text="Forgot password?"
              @click="$emit('forgotPassword')"
            />
          </template>
        </div>
      </v-form>
    </v-container>
    <template v-if="oauthProviders && oauthProviders.length">
      <v-divider />
      <girder-oauth :providers="oauthProviders" />
    </template>
  </div>
</template>
