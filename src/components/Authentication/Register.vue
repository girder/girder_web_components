<template lang="pug">
.register-widget
  v-alert.mt-0(
      dismissible,
      transition="scale-transition",
      v-for="err in alerts.errors",
      :key="err",
      :value="true",
      type="error") {{ err }}
  v-alert.mt-0(
      dismissible,
      transition="scale-transition",
      v-for="info in alerts.infos",
      :key="info",
      :value="true",
      type="info") {{ info }}
  v-container
    v-form(@submit.prevent="register", ref="form")
      v-text-field(
          v-model="login",
          label="Username",
          :rules="nonEmptyRules",
          type="text",
          autofocus)
      v-text-field(
          v-model="email",
          label="Email",
          :rules="nonEmptyRules",
          type="email")
      v-text-field(
          v-model="firstName",
          label="First Name",
          :rules="nonEmptyRules",
          type="text")
      v-text-field(
          v-model="lastName",
          label="Last Name",
          :rules="nonEmptyRules",
          type="text")
      v-text-field(
          v-model="password",
          type="password",
          label="Password",
          :rules="nonEmptyRules")
      v-text-field(
          v-model="retypePassword",
          type="password",
          label="Retype password",
          :rules="retypeMustMatchPasswordRules")
      v-btn.ml-0(type="submit",
          color="primary",
          :loading="inProgress") Register
  template(#default, v-if="oauthProviders && oauthProviders.length")
    v-divider
    girder-oauth(verb="register", :providers="oauthProviders")
</template>

<script>
import GirderOauth from './OAuth.vue';

export default {
  inject: ['girderRest'],
  components: {
    GirderOauth,
  },
  props: {
    oauthProviders: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    const nonEmptyRules = [v => !!v || 'Item is required'];
    const retypeMustMatchPasswordRules = [
      ...nonEmptyRules,
      v => v === this.password || 'Passwords must match',
    ];
    return {
      login: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      retypePassword: '',
      retypePasswordErrors: [],
      inProgress: false,
      alerts: {
        errors: [],
        infos: [],
      },
      nonEmptyRules,
      retypeMustMatchPasswordRules,
    };
  },
  methods: {
    async register() {
      if (!this.$refs.form.validate()) {
        return;
      }
      this.inProgress = true;
      this.alerts.errors = [];
      this.alerts.infos = [];
      try {
        const resp = await this.girderRest.register(
          this.login,
          this.email,
          this.firstName,
          this.lastName,
          this.password,
        );
        if (!resp.data.authToken) {
          this.alerts.infos.push('Registration needs email verification or administrator approval. \nCheck your email to continue.');
          this.$refs.form.reset();
        }
      } catch (err) {
        if (!err.response || err.response.status !== 400) {
          this.alerts.errors.push('Unknown error.');
          throw err;
        } else {
          this.alerts.errors.push(err.response.data.message || 'Invalid registration.');
        }
      } finally {
        this.inProgress = false;
      }
    },
  },
};
</script>
