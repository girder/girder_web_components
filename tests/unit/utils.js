import Vue from 'vue';
import Girder from '@/index';

const girderVue = () => {
  Vue.use(Girder);
  return Vue;
};

function wrapMock(callback, status = 200, reply = {}) {
  return (config) => {
    try {
      callback(config);
      return [status, reply];
    } catch (err) {
      console.error(err); // eslint-disable-line no-console
      return [400];
    }
  };
}

const flushPromises = () => new Promise((resolve) => { setTimeout(resolve); });

export {
  flushPromises,
  girderVue,
  wrapMock,
};
