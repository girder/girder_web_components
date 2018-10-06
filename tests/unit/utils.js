import { createLocalVue } from '@vue/test-utils';
import Girder from '@/index';

const girderVue = () => {
  const localVue = createLocalVue();
  localVue.use(Girder);
  return localVue;
};

const flushPromises = () => new Promise((resolve) => { setTimeout(resolve); });

export {
  flushPromises,
  girderVue,
};
