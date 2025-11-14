import Vue from 'vue';
import GirderPlugin, {
  NotificationBus, RestClient, vuetify,
} from '@/';

import App from './App.vue';

Vue.use(GirderPlugin);

const girderRest = new RestClient({
  apiRoot: process.env.VUE_APP_API_ROOT,
});

const notificationBus = new NotificationBus(girderRest, {
});

girderRest.fetchUser().then((user) => {
  console.log('user', user);
  if (user) {
    notificationBus.connect();
  }

  new Vue({
    vuetify,
    provide: { girderRest, notificationBus },
    render: (h) => h(App),
  }).$mount('#app');
});
