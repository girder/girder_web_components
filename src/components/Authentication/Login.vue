<script>
import { ref, inject } from "vue";
import GirderOauth from "./OAuth.vue";

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
    // ---- Constants ----
    const OTP_MAGIC_SUBSTRING =
      "authentication must include a one-time password";

    // ---- Injected client ----
    const { rest } = inject("girder");

    // ---- State ----
    const username = ref("");
    const password = ref("");
    const otp = ref(null);
    const otpFormVisible = ref(false);
    const requiresEmailVerification = ref(false);
    const inProgress = ref(false);

    const alerts = ref({
      error: "",
      success: "",
    });

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
    const sendVerification = async () => {
      await rest.post("user/verification", null, {
        params: { login: username.value },
      });

      alerts.value.error = "";
      alerts.value.success = "Verification email sent";
      requiresEmailVerification.value = false;
    };

    const login = async () => {
      const valid = await loginForm.value.validate();
      if (!valid) {return;}

      alerts.value.error = "";
      alerts.value.success = "";
      requiresEmailVerification.value = false;
      inProgress.value = true;

      try {
        await rest.login(
          username.value,
          password.value,
          otp.value
        );

        password.value = "";
        otp.value = null;
        otpFormVisible.value = false;
      } catch (err) {
        if (!err.response || err.response.status !== 401) {
          alerts.value.error = "Unknown error.";
          throw err;
        }

        const { message, extra } = err.response.data;

        if (message?.includes(OTP_MAGIC_SUBSTRING)) {
          otp.value = null;
          otpFormVisible.value = true;
          loginForm.value.resetValidation();
        } else {
          alerts.value.error = message || "Unauthorized.";

          if (extra === "emailVerification") {
            requiresEmailVerification.value = true;
          }
        }
      } finally {
        inProgress.value = false;
      }
    };

    return {
      username,
      password,
      otp,
      otpFormVisible,
      requiresEmailVerification,
      inProgress,
      alerts,
      loginForm,
      nonEmptyRules,
      otpRules,
      login,
      sendVerification,
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
