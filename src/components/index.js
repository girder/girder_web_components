import Vue from 'vue';
import Vuetify from 'vuetify';
import '@mdi/font/css/materialdesignicons.min.css';
import 'vuetify/dist/vuetify.min.css';
import Upload from './Upload.vue';
import vuetifyConfig from './vuetifyConfig';

Vue.use(Vuetify, vuetifyConfig);

export default {
  Upload,
};
