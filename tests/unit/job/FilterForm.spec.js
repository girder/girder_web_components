import { mount } from '@vue/test-utils';
import FilterForm from '@/components/Job/FilterForm.vue';
import * as status from '@/components/Job/status';

import { girderVue } from '../utils';

const localVue = girderVue();

describe('FilterForm.vue', () => {
  let app;

  // Fixes warning with certain vuetify components
  // https://forum.vuejs.org/t/vuetify-data-app-true-and-problems-rendering-v-dialog-in-unit-tests/27495/2
  beforeEach(() => {
    app = document.createElement('div');
    app.setAttribute('data-app', true);
    document.body.appendChild(app);
  });
  afterEach(() => {
    document.body.removeChild(app);
  });

  it('mount with job type list', () => {
    const wrapper = mount(FilterForm, {
      localVue,
      propsData: {
        jobTypeList: ['type 1', 'type 2'],
      },
    });
    expect(wrapper.find({ name: 'v-select' }).vm.items).toEqual(['type 1', 'type 2']);
  });

  it('mount with status list', () => {
    const wrapper = mount(FilterForm, {
      localVue,
      propsData: {
        statusList: [0, 1, 2, 3],
      },
    });
    const statusSelect = wrapper.findAll({ name: 'v-select' }).at(1);
    expect(statusSelect.vm.items.map(s => s.value)).toEqual([0, 1, 2, 3]);
  });

  it('mount with custom status item', () => {
    status.register({
      CUSTOM_TEST_STATUS: {
        value: 999,
        text: '0Custom', // make it sort first
      },
    });

    const wrapper = mount(FilterForm, {
      localVue,
      propsData: {
        statusList: [0, 1, 2, 999],
      },
    });
    const statusSelect = wrapper.findAll({ name: 'v-select' }).at(1);
    expect(statusSelect.vm.items.map(s => s.value)).toEqual([999, 0, 1, 2]);
  });

  it('mount with unknown status item', () => {
    const wrapper = mount(FilterForm, {
      localVue,
      propsData: {
        statusList: [0, 1, 2, 998],
      },
    });
    const statusSelect = wrapper.findAll({ name: 'v-select' }).at(1);
    expect(statusSelect.vm.items.map(s => s.value)).toEqual([0, 1, 2]);
  });
});
