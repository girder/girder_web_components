import RestClient from '@/rest';
import Vue from 'vue';
import OauthClient from '@girder/oauth-client';
import * as Sentry from '@sentry/vue';
import Girder, { vuetify } from '@';
import App from './App.vue';
import router from './router';

Vue.use(Girder);

const oauthClient = new OauthClient(
  process.env.VUE_APP_OAUTH_API_ROOT,
  process.env.VUE_APP_OAUTH_CLIENT_ID,
  [],
);

const girderRest = new RestClient({
  apiRoot: process.env.VUE_APP_API_ROOT,
});

Sentry.init({
  Vue,
  dsn: process.env.VUE_APP_SENTRY_DSN,
});

oauthClient.maybeRestoreLogin().then(async () => {
  girderRest.interceptors.request.use((config) => ({
    ...config,
    headers: {
      ...config.headers,
      ...oauthClient.authHeaders,
    },
  }));
  await girderRest.fetchUser();
  new Vue({
    vuetify,
    router,
    render: (h) => h(App),
    provide: { girderRest, oauthClient },
  }).$mount('#app');
});
