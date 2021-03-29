<template>
  <v-card class="girder-authentication-component">
    <v-tabs
      v-model="activeTab"
      background-color="primary"
      dark="dark"
    >
      <v-tabs-slider color="yellow" />
      <v-tab key="login">
        Log In
      </v-tab>
      <v-tab
        v-if="register"
        key="registration"
      >
        Register
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="activeTab">
      <v-tab-item key="login-box">
        <girder-login
          :oauth-providers="oauthProviders"
          v-bind="{ forceOtp, forgotPasswordUrl, forgotPasswordRoute, hideForgotPassword }"
          @forgotpassword="$emit('forgotpassword')"
        />
      </v-tab-item>
      <v-tab-item
        v-if="register"
        key="registration-box"
      >
        <girder-registration :oauth-providers="oauthProviders" />
      </v-tab-item>
    </v-tabs-items>
  </v-card>
</template>

<script>
import Vue from 'vue';
import GirderLogin from './Login.vue';
import GirderRegistration from './Register.vue';
import { OauthTokenPrefix, OauthTokenSuffix } from '../../rest';

export default Vue.extend({
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
          return (
            await this.girderRest.get('oauth/provider', {
              params: {
                redirect: `${window.location.href}${OauthTokenPrefix}{girderToken}${OauthTokenSuffix}`,
                list: true,
              },
            })
          ).data;
        } catch (e) {
          return [];
        }
      } else {
        return [];
      }
    },
  },
});
</script>
