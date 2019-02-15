import Vue from 'vue';
import Girder from '@';
import App from './App.vue';
import RestClient from '@/rest';

Vue.use(Girder);
const girderRest = new RestClient({
  apiRoot: process.env.NODE_ENV === 'production'
    ? 'https://data.kitware.com/api/v1'
    : 'http://localhost:8080/api/v1',
});

girderRest.fetchUser().then(() => {
  new Vue({
    render: h => h(App),
    provide: { girderRest },
  }).$mount('#app');
});
