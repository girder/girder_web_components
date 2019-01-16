import Vue from 'vue';
import Girder from '.';
import App from './App.vue';
import RestClient from './rest';

Vue.use(Girder);
const girderRest = new RestClient({ apiRoot: 'http://localhost:8080/api/v1' });

girderRest.fetchUser().then(() => {
  new Vue({
    propsData: {
      foo: 2,
    },
    render: h => h(App, {
      props: {
        foo: 'bar',
      },
    }),
    provide: { girderRest },
  }).$mount('#app');
});
