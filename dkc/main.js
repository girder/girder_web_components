import RestClient from '@/rest';
import Vue from 'vue';
import Girder, { vuetify } from '@';
import App from './App.vue';
import router from './router';

Vue.use(Girder);
const girderRest = new RestClient({
  apiRoot: process.env.VUE_APP_API_ROOT,
});

girderRest.fetchUser().then(() => {
  new Vue({
    vuetify,
    router,
    render: (h) => h(App),
    provide: { girderRest },
  }).$mount('#app');
});
