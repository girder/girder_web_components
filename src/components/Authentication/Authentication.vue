<template lang="pug">
v-card.girder-authentication-component
  v-tabs(v-model="activeTab", background-color="primary", dark)
    v-tabs-slider(color="yellow")
    v-tab(key="login") Log In
    v-tab(key="registration", v-if="register") Register
  v-tabs-items(v-model="activeTab")
    v-tab-item(key="login-box")
      girder-login(:oauth-providers="oauthProviders",
          v-bind="{ forceOtp, forgotPasswordUrl, forgotPasswordRoute, hideForgotPassword }",
          @forgotpassword="$emit('forgotpassword')")
    v-tab-item(key="registration-box", v-if="register")
      girder-registration(:oauth-providers="oauthProviders")
</template>

<script>
import GirderLogin from './Login.vue';
import GirderRegistration from './Register.vue';
import { OauthTokenPrefix, OauthTokenSuffix } from '../../rest';

export default {
  inject: ['girderRest'],
  components: {
    GirderLogin,
    GirderRegistration,
  },
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
    /* A full URL to be used as an anchor href to an external page. */
    forgotPasswordUrl: {
      type: String,
      default: null,
    },
    /* A vue-router route path. */
    forgotPasswordRoute: {
      type: [Object, String],
      default: null,
    },
    /* If you enforce 2FA, show that field automatically */
    forceOtp: {
      type: Boolean,
      default: false,
    },
    hideForgotPassword: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeTab: null,
    };
  },
  asyncComputed: {
    async oauthProviders() {
      if (this.oauth) {
        try {
          return (await this.girderRest.get('oauth/provider', {
            params: {
              redirect: `${window.location.href}${OauthTokenPrefix}{girderToken}${OauthTokenSuffix}`,
              list: true,
            },
          })).data;
        } catch (e) {
          return [];
        }
      } else {
        return [];
      }
    },
  },
};
</script>
