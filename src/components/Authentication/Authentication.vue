<template lang="pug">
v-card.girder-authentication-component
  v-tabs(v-model="activeTab", color="primary", slider-color="yellow", dark)
    v-tab(key="login") Log In
    v-tab(key="registration", v-if="register") Register
    v-tab-item(key="login-box")
      girder-login(:oauth-providers="oauthProviders",
          :forgot-password-url="forgotPasswordUrl",
          :forgot-password-route="forgotPasswordRoute",
          @forgotpassword="$emit('forgotpassword')")
    v-tab-item(key="registration-box", v-if="register")
      girder-registration(:oauth-providers="oauthProviders")
</template>

<script>
import GirderLogin from './Login.vue';
import GirderRegistration from './Register.vue';

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
    /* A full URL to be used as an anchor href to an external page. */
    forgotPasswordUrl: {
      type: String,
    },
    /* A vue-router route path. */
    forgotPasswordRoute: {
      type: [Object, String],
    },
  },
  components: {
    GirderLogin,
    GirderRegistration,
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
              redirect: window.location.href,
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
