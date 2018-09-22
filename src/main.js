import Vue from 'vue';
import App from './App.vue';
import RestClient from './rest';

const girderRest = new RestClient({ apiRoot: 'http://localhost:8080/api/v1' });

girderRest.fetchUser().then(() => {
  new Vue({
    render: h => h(App),
    provide: { girderRest },
  }).$mount('#app');
});
