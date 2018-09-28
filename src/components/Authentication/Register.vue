<template lang="pug">
.register-widget
  v-alert(
      dismissible,
      v-for="err in alerts.errors",
      :key="err",
      :value="true",
      type="error") {{ err }}
  form(@submit.prevent="register", ref="register")
    v-container
      v-text-field(
          v-model="username",
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
          label="First name",
          :rules="nonEmptyRules",
          type="text")
      v-text-field(
          v-model="lastName",
          label="Last name",
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
          :rules="nonEmptyRules")
      v-btn(type="submit",
          color="primary",
          :loading="inProgress") Register
  v-divider
  oauth(ref="oauth", verb="register", :providers="oauthProviders")
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
  data() {
    return {
      username: '',
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
      nonEmptyRules: [
        v => !!v || 'Item is required',
      ],
    };
  },
  components: {
    Oauth,
  },
  watch: {
    password() {
      this.validatePasswordsMatch();
    },
    retypePassword() {
      this.validatePasswordsMatch();
    },
  },
  methods: {
    listify: v => (v ? [v] : []),
    reset() {
      this.username = '';
      this.email = '';
      this.firstName = '';
      this.lastName = '';
      this.password = '';
      this.retypePassword = '';
    },
    validatePasswordsMatch() {
      if (this.password === this.retypePassword) {
        this.retypePasswordErrors = [];
      } else {
        this.retypePasswordErrors = ['Passwords do not match'];
      }
    },
    async register() {
      if (!this.$refs.register.validate()) {
        return null;
      }
      this.inProgress = true;
      let resp;
      try {
        resp = await this.girderRest.register(
          this.username, this.email,
          this.firstName, this.lastName, this.password,
        );
      } catch (err) {
        this.inProgress = false;
        if (!err.response || err.response.status !== 400) {
          throw err;
        } else {
          this.alerts.errors.length = 0;
          this.alerts.errors.push(err.response.data.message || 'Unknown error.');
        }
        return null;
      }
      this.alerts.errors.length = 0;
      this.inProgress = false;
      return resp;
    },
  },
};
</script>
