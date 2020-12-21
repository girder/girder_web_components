import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import GirderPlugin, {
  NotificationBus, RestClient, vuetifyConfig, registerComponents,
} from '@/';

import App from './App.vue';

Vue.use(GirderPlugin);
registerComponents();

const girderRest = new RestClient({
  apiRoot: process.env.VUE_APP_API_ROOT,
});

const notificationBus = new NotificationBus(girderRest, {
  useEventSource: true,
});

const vuetify = new Vuetify(vuetifyConfig);

girderRest.fetchUser().then((user) => {
  if (user) {
    notificationBus.connect();
  }

  new Vue({
    vuetify,
    provide: { girderRest, notificationBus },
    render: (h) => h(App),
  }).$mount('#app');
});
