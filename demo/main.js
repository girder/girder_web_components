import Vue from 'vue';
import Girder from '@';
import NotificationBus from '@/utils/notifications';
import RestClient from '@/rest';

import App from './App.vue';

Vue.use(Girder);
const girderRest = new RestClient({
  apiRoot: process.env.VUE_APP_API_ROOT,
});

const notificationBus = new NotificationBus(girderRest);
notificationBus.connect();

girderRest.fetchUser().then(() => {
  new Vue({
    render: h => h(App),
    provide: { girderRest, notificationBus },
  }).$mount('#app');
});
