<template lang="pug">
.girder-authentication-component
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
        registration(ref="registerForm",
            :oauth-providers="oauthProviders")
</template>

<script>
import Login from './Login.vue';
import Registration from './Register.vue';

export default {
  inject: ['girderRest'],
  props: {
    /* Enable registration from this component? */
    register: {
      type: Boolean,
      default: false,
    },
    /* Enable OAuth login from this component? */
    oauth: {
      type: Boolean,
      default: false,
    },
    /* A full URL to be used as an anchor href to an external page.
     * Overrides forgotPasswordRoute.
     */
    forgotPasswordUrl: {
      type: String,
    },
    /* A vue-router route path.  Must use object form. */
    forgotPasswordRoute: {
      type: Object,
    },
  },
  components: {
    Login,
    Registration,
  },
  data() {
    return {
      activeTab: null,
      oauthProviders: [],
    };
  },
  async mounted() {
    if (this.oauth) {
      try {
        this.oauthProviders = (await this.girderRest.get('oauth/provider', {
          params: {
            redirect: window.location.href,
            list: true,
          },
        })).data;
      } catch (e) { /* use default=[] */ }
    }
  },
};
</script>

<style lang="stylus">
.girder-authentication-component
  .v-btn
    margin-left 0px
    margin-right 16px
  .v-icon.aligned.v-icon--left
    margin-right 8px;
  .v-form .container
    padding-left: 24px;
  .v-alert.error
    margin 0px
    padding 10px 16px
  .v-alert__icon
    margin-right 8px
</style>
