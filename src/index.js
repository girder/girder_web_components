import VueAsyncComputed from 'vue-async-computed';
import Vuetify from 'vuetify/lib';
import * as components from './components';
import * as constants from './constants';
import RestClient from './rest';
import * as utils from './utils';

/**
 * This installs the Vue plugin for this library. This is exported in the top level module,
 * making it a Vue plugin.
 * @param {Object} Vue the Vue prototype to install the plugin into.
 */
function install(Vue) {
  Vue.use(Vuetify);
  Vue.use(VueAsyncComputed);
}

/** The default configured Vuetify instance */
const vuetify = new Vuetify({ ...utils.vuetifyConfig });

export {
  components,
  constants,
  RestClient,
  utils,
  vuetify,
};

export default {
  install,
};
