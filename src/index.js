import VueAsyncComputed from 'vue-async-computed';
import Vuetify from 'vuetify';
import * as components from './components';
import * as constants from './constants';
import RestClient from './rest';
import * as utils from './utils';

/**
 * This installs the Vue plugin for this library. This is exported in the top level module,
 * making it a Vue plugin.
 * @param Vue the Vue prototype to install the plugin into.
 */
function install(Vue) {
  Vue.use(Vuetify, utils.vuetifyConfig);
  Vue.use(VueAsyncComputed);

  const eventBus = new Vue();
  /* eslint-disable no-param-reassign */
  Vue.prototype.$girderOn = function on(event, callback) {
    if (!this.subscriptions) {
      this.subscriptions = [];
    }
    this.subscriptions.push({ event, callback });
    eventBus.$on(event, callback);
  };
  /* eslint-disable no-param-reassign */
  Vue.prototype.$girderOffAll = function offAll() {
    this.subscriptions.forEach(({ event, callback }) => {
      eventBus.$off(event, callback);
    });
  };
  /* eslint-disable no-param-reassign */
  Vue.prototype.$girderEmit = function emit(event, ...args) {
    eventBus.$emit(event, ...args);
  };
}

export {
  components,
  constants,
  RestClient,
  utils,
};

export default {
  install,
};
