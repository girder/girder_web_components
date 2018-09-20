import Vue from 'vue';
import Vuetify from 'vuetify';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'vuetify/dist/vuetify.min.css';
import App from './App.vue';
import RestClient from './rest';

const girderRest = new RestClient({ apiRoot: 'http://localhost:8080/api/v1' });

Vue.use(Vuetify, {
  iconfont: 'fa',
});

girderRest.fetchUser().then(() => {
  new Vue({
    render: h => h(App),
    provide: { girderRest },
  }).$mount('#app');
});
