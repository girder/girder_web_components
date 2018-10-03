import { shallowMount } from '@vue/test-utils';
import RestClient from '@/rest';
import Upload from '@/components/Upload.vue';
import { girderVue } from './utils';

const localVue = girderVue();

describe('Upload.vue', () => {
  it('renders destination name', () => {
    const wrapper = shallowMount(Upload, {
      localVue,
      propsData: {
        dest: {
          _modelType: 'folder',
          _id: '1234',
          name: 'The parent folder',
        },
      },
      provide: { girderRest: new RestClient() },
    });
    expect(wrapper.text()).toEqual(expect.stringContaining('The parent folder'));
  });
});
