<template lang="pug">
.register-widget
  v-alert.mt-0(
      dismissible,
      transition="scale-transition",
      v-for="err in alerts.errors",
      :key="err",
      :value="true",
      type="error") {{ err }}
  v-container
    v-form(@submit.prevent="register", ref="register")
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
  template(v-if="oauthProviders && oauthProviders.length")
    v-divider
    girder-oauth(verb="register", :providers="oauthProviders")
</template>

<script>
import GirderOauth from './OAuth.vue';

export default {
  inject: ['girderRest'],
  props: {
    oauthProviders: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    GirderOauth,
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
      },
      nonEmptyRules,
      retypeMustMatchPasswordRules,
    };
  },
  methods: {
    async register() {
      if (!this.$refs.register.validate()) {
        return;
      }
      this.inProgress = true;
      this.alerts.errors = [];
      try {
        await this.girderRest.register(
          this.login,
          this.email,
          this.firstName,
          this.lastName,
          this.password,
        );
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
