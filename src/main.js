import Vue from 'vue';
import Girder from '.';
import App from './App.vue';
import RestClient from './rest';

Vue.use(Girder);
const girderRest = new RestClient({ apiRoot: 'http://rig:8080/api/v1' });

girderRest.fetchUser().then(() => {
  new Vue({
    render: h => h(App),
    provide: { girderRest },
  }).$mount('#app');
});
