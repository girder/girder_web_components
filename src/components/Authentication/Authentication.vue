<script>
import { ref, inject, watch } from 'vue';
import GirderLogin from './Login';
import GirderRegister from './Register';
import { OauthTokenPrefix, OauthTokenSuffix } from '@/utils/restClient';

export default {
  name: 'GirderAuthentication',

  components: {
    GirderLogin,
    GirderRegister,
  },

  props: {
    register: { type: Boolean, default: false },
    oauth: { type: Boolean, default: false },
    forgotPasswordUrl: { type: String, default: null },
    forgotPasswordRoute: { type: [Object, String], default: null },
    forceOtp: { type: Boolean, default: false },
    hideForgotPassword: { type: Boolean, default: false },
  },

  emits: ['forgotPassword'],

  setup(props) {
    // Inject Girder REST client
    const { rest, apiRoot } = inject("girder");

    // State
    const activeTab = ref("login");
    const oauthProviders = ref([]);

    // Load OAuth providers automatically when props or client changes
    watch(
      () => [props.oauth, apiRoot],
      async ([oauth]) => {
        if (!oauth) {
          oauthProviders.value = [];
          return;
        }

        try {
          const result = await rest.get("oauth/provider", {
            params: {
              redirect: `${window.location.href}${OauthTokenPrefix}{girderToken}${OauthTokenSuffix}`,
              list: true,
            },
          });

          oauthProviders.value = Array.isArray(result.data) ? result.data : [];
        } catch {
          oauthProviders.value = [];
        }
      },
      { immediate: true }
    );

    return {
      activeTab,
      oauthProviders,
    };
  },
};
</script>

<template>
  <v-card class="authentication">
    <v-card-item>
      <v-tabs
        v-model="activeTab"
        background-color="primary"
        dark="dark"
      >
        <v-tab
          text="Log In"
          value="login"
        />
        <v-tab
          v-if="register"
          text="Register"
          value="registration"
        />
      </v-tabs>
    </v-card-item>
    <v-card-text>
      <v-tabs-window v-model="activeTab">
        <v-tabs-window-item value="login">
          <girder-login
            :oauth-providers="oauthProviders"
            v-bind="{ forceOtp, forgotPasswordUrl, forgotPasswordRoute, hideForgotPassword }"
            @forgot-password="$emit('forgotPassword')"
          />
        </v-tabs-window-item>
        <v-tabs-window-item
          v-if="register"
          value="registration"
        >
          <girder-register :oauth-providers="oauthProviders" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.authentication {
  :deep(.v-card-item) {
    padding: 0;
    background-color: rgb(var(--v-theme-surface-light));
  }

  :deep(.v-card-text) {
    padding: 0;
  }
}
</style>