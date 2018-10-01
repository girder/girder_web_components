<template lang="pug">
.register-widget
  v-alert(
      dismissible,
      transition="scale-transition",
      v-for="err in alerts.errors",
      :key="err",
      :value="true",
      type="error") {{ err }}
  v-form(@submit.prevent="register", ref="register")
    v-container
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
      v-btn(type="submit",
          color="primary",
          :loading="inProgress") Register
  v-divider(v-if="oauthProviders.length")
  oauth(ref="oauth",
      v-if="oauthProviders.length",
      verb="register",
      :providers="oauthProviders")
</template>

<script>
import Oauth from './OAuth.vue';

export default {
  inject: ['girderRest'],
  props: {
    oauthProviders: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    Oauth,
  },
  data() {
    const nonEmptyRules = [v => !!v || 'Item is required'];
    const retypeMustMatchPasswordRules = nonEmptyRules.concat([
      v => v === this.password || 'Passwords must match',
    ]);
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
      this.alerts.errors.length = 0;
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
