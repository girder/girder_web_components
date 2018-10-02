import Vuetify from 'vuetify';
import * as components from './components';
import RestClient from './rest';
import * as utils from './utils';

/**
 * This installs the Vue plugin for this library. This is exported in the top level module,
 * making it a Vue plugin.
 * @param Vue the Vue prototype to install the plugin into.
 */
function install(Vue) {
  Vue.use(Vuetify, utils.vuetifyConfig);
}

export {
  components,
  RestClient,
  utils,
};

export default {
  install,
};
