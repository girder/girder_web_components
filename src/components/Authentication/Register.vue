<template>
  <div class="register-widget">
    <v-container>
      <v-alert
        v-for="err in alerts.errors"
        :key="err"
        :value="true"
        class="mt-0"
        dismissible="dismissible"
        transition="scale-transition"
        type="error"
      >
        {{ err }}
      </v-alert>
      <v-alert
        v-for="info in alerts.infos"
        :key="info"
        :value="true"
        class="mt-0"
        dismissible="dismissible"
        transition="scale-transition"
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
          label="Username"
          type="text"
          autofocus="autofocus"
        />
        <v-text-field
          v-model="email"
          :rules="nonEmptyRules"
          label="Email"
          type="email"
        />
        <v-text-field
          v-model="firstName"
          :rules="nonEmptyRules"
          label="First Name"
          type="text"
        />
        <v-text-field
          v-model="lastName"
          :rules="nonEmptyRules"
          label="Last Name"
          type="text"
        />
        <v-text-field
          v-model="password"
          :rules="nonEmptyRules"
          type="password"
          label="Password"
        />
        <v-text-field
          v-model="retypePassword"
          :rules="retypeMustMatchPasswordRules"
          type="password"
          label="Retype password"
        />
        <v-btn
          :loading="inProgress"
          class="ml-0"
          type="submit"
          color="primary"
        >
          Register
        </v-btn>
      </v-form>
    </v-container><template v-if="oauthProviders && oauthProviders.length">
      <v-divider />
      <girder-oauth
        :providers="oauthProviders"
        verb="register"
      />
    </template>
  </div>
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
    const nonEmptyRules = [(v) => !!v || 'Item is required'];
    const retypeMustMatchPasswordRules = [
      ...nonEmptyRules,
      (v) => v === this.password || 'Passwords must match',
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
