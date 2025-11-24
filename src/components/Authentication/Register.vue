<script>
import { ref, inject } from "vue";
import GirderOauth from "./OAuth.vue";

export default {
  name: "GirderRegister",

  components: { GirderOauth },

  props: {
    oauthProviders: { type: Array, default: () => [] },
  },

  setup() {
    // ---- Injected client ----
    const { rest } = inject("girder");

    // ---- State ----
    const login = ref("");
    const email = ref("");
    const firstName = ref("");
    const lastName = ref("");
    const password = ref("");
    const retypePassword = ref("");
    const inProgress = ref(false);

    const alerts = ref({
      error: "",
      success: "",
    });

    const form = ref(null);

    // ---- Valiodation rules ----
    const nonEmptyRules = [(v) => !!v || "Item is required"];
    const retypeMustMatchPasswordRules = [
      ...nonEmptyRules,
      (v) => v === password.value || "Passwords must match",
    ];

    // ---- Methods ----
    const register = async () => {
      if (form.value.validate()) {
        return;
      }

      inProgress.value = true;
      alerts.value.error = "";
      alerts.value.success = "";

      try {
        const resp = await rest.register(
          login.value,
          email.value,
          firstName.value,
          lastName.value,
          password.value
        );

        if (!resp.data.authToken) {
          alerts.value.success =
            "Registration needs email verification or administrator approval.\nCheck your email to continue.";
          form.value.reset();
        }
      } catch (err) {
        if (!err.response || err.response.status !== 400) {
          alerts.value.error = "Unknown error.";
          throw err;
        } else {
          alerts.value.error =
            err.response.data.message || "Invalid registration.";
        }
      } finally {
        inProgress.value = false;
      }
    };

    return {
      login,
      email,
      firstName,
      lastName,
      password,
      retypePassword,
      inProgress,
      alerts,
      form,
      nonEmptyRules,
      retypeMustMatchPasswordRules,
      register,
    };
  },
};
</script>

<template>
  <div class="register-widget">
    <v-container>
      <v-alert
        v-for="err in alerts.errors"
        :key="err"
        class="mt-0"
        dismissible="dismissible"
        type="error"
      >
        {{ err }}
      </v-alert>
      <v-alert
        v-for="info in alerts.infos"
        :key="info"
        class="mt-0"
        dismissible="dismissible"
        type="info"
      >
        {{ info }}
      </v-alert>
      <v-form
        ref="form"
        @submit.prevent="register"
      >
        <v-text-field
          v-model="login"
          :rules="nonEmptyRules"
          variant="solo-filled"
          flat
          label="Username"
          type="text"
          autocomplete="username"
        />
        <v-text-field
          v-model="email"
          :rules="nonEmptyRules"
          variant="solo-filled"
          flat
          label="Email"
          type="email"
        />
        <v-text-field
          v-model="firstName"
          :rules="nonEmptyRules"
          variant="solo-filled"
          flat
          label="First Name"
          type="text"
        />
        <v-text-field
          v-model="lastName"
          :rules="nonEmptyRules"
          variant="solo-filled"
          flat
          label="Last Name"
          type="text"
        />
        <v-text-field
          v-model="password"
          :rules="nonEmptyRules"
          variant="solo-filled"
          flat
          type="password"
          label="Password"
          autocomplete="new-password"
        />
        <v-text-field
          v-model="retypePassword"
          :rules="retypeMustMatchPasswordRules"
          variant="solo-filled"
          flat
          type="password"
          label="Retype password"
          autocomplete="new-password"
        />
        <v-btn
          :loading="inProgress"
          rounded
          variant="flat"
          type="submit"
          color="primary"
          text="Register"
        />
      </v-form>
    </v-container>
    <template v-if="oauthProviders && oauthProviders.length">
      <v-divider />
      <girder-oauth
        :providers="oauthProviders"
        verb="Register"
      />
    </template>
  </div>
</template>
