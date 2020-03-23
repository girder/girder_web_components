import Vue from 'vue';
import NotificationBus from '@/utils/notifications';
import RestClient from '@/rest';
import Girder, { vuetify } from '@';

import App from './App.vue';

Vue.use(Girder);
const girderRest = new RestClient({
  apiRoot: process.env.VUE_APP_API_ROOT,
});

const notificationBus = new NotificationBus(girderRest, {
  useEventSource: true,
});

girderRest.fetchUser().then((user) => {
  if (user) {
    notificationBus.connect();
  }

  new Vue({
    vuetify,
    render: (h) => h(App),
    provide: { girderRest, notificationBus },
  }).$mount('#app');
});
