import '@mdi/font/css/materialdesignicons.min.css';
import VueAsyncComputed from 'vue-async-computed';
import Vuetify from 'vuetify/lib';

/**
 * This installs the Vue plugin for this library. This is exported in the top level module,
 * making it a Vue plugin.
 * @param {Object} Vue the Vue prototype to install the plugin into.
 */
export default function install(Vue) {
  Vue.use(Vuetify);
  Vue.use(VueAsyncComputed);
}

export * from './components';
export * from './constants';
export { default as RestClient } from './rest';
export * from './components/snippets';
export * from './utils';
