import Vue from 'vue';
import Vuetify from 'vuetify';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'vuetify/dist/vuetify.min.css';
import Upload from './Upload.vue';

Vue.use(Vuetify, {
  iconfont: 'fa',
});

export default {
  Upload,
};
