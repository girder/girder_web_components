<template lang="pug">
v-flex.pa-2.girder-authentication-component(xs-12)
  v-card
    v-tabs(v-model="activeTab", color="primary", slider-color="yellow", dark)
      v-tab(key="login") Log In
      v-tab(key="registration", v-if="register") Register
      v-tab-item(key="login-box")
        login(ref="loginForm",
            :oauth-providers="oauthProviders",
            :forgot-password-url="forgotPasswordUrl",
            :forgot-password-route="forgotPasswordRoute",
            @forgotpassword="$emit('forgotpassword')")
      v-tab-item(key="registration-box", v-if="register")
        registration(
            ref="registerForm",
            :oauth-providers="oauthProviders")
</template>

<script>
import Login from './Login.vue';
import Registration from './Register.vue';

export default {
  inject: ['girderRest'],
  props: {
    register: {
      type: Boolean,
      default: false,
      note: 'Enable registration from this component?',
    },
    oauth: {
      type: Boolean,
      default: false,
      note: 'Enable OAuth login from this component?',
    },
    forgotPasswordUrl: {
      type: String,
      note: 'A full URL to be used as an anchor href to an external page.  Overrides forgotPasswordRoute.',
    },
    forgotPasswordRoute: {
      type: Object,
      note: 'A vue-router route path.  Must use object form.',
    },
  },
  components: {
    Login,
    Registration,
  },
  data() {
    return {
      activeTab: null,
      loginInProgress: false,
      registerInProgress: false,
      loginErrors: null,
      registerErrors: null,
      oauthProviders: [],
    };
  },
  async mounted() {
    if (this.oauth) {
      const resp = await this.girderRest.fetchOauth();
      this.oauthProviders = [];
      resp.data.forEach((provider) => {
        this.oauthProviders.push({
          id: provider.id,
          name: provider.name,
          url: provider.url,
        });
      });
    }
  },
};
</script>

<style lang="stylus">
.girder-authentication-component
  .no-decorate
    text-decoration none
  .v-btn
    margin-left 0px
    margin-right 16px
  .v-icon.aligned
    font-size 18px
    vertical-align middle
    padding-bottom 2px
</style>

<style lang="stylus" scoped>
.v-alert.error
  margin 0px
  padding 10px 16px
.v-alert__icon
  margin-right 8px
</style>
