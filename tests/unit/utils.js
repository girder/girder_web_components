import Vue from 'vue';
import Girder from '@/index';

const girderVue = () => {
  Vue.use(Girder);
  return Vue;
};

const flushPromises = () => new Promise((resolve) => { setTimeout(resolve); });

export {
  flushPromises,
  girderVue,
};
