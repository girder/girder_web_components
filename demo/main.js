import Vue from 'vue';
import Girder from '@';
import App from './App.vue';
import RestClient from '@/rest';

Vue.use(Girder);
const girderRest = new RestClient({
  apiRoot: process.env.VUE_APP_API_ROOT,
});

girderRest.fetchUser().then(() => {
  new Vue({
    render: h => h(App),
    provide: { girderRest },
  }).$mount('#app');
});
