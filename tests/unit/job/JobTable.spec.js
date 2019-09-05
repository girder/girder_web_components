import { mount } from '@vue/test-utils';
import JobTable from '@/components/Job/JobTable.vue';

import { girderVue, vuetify } from '../utils';

const localVue = girderVue();

const job = {
  title: 'job',
  type: 'type',
  updated: '2000-01-01T05:00:00.000',
  status: 3,
};

describe('JobTable.vue', () => {
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

  it('mount with no data', () => {
    const wrapper = mount(JobTable, {
      localVue,
      vuetify,
      propsData: {
        jobs: [],
        options: {},
      },
    });
    expect(wrapper.find('tbody').text()).toBe('No data available');
  });

  it('mount with one job', () => {
    const wrapper = mount(JobTable, {
      localVue,
      vuetify,
      propsData: {
        jobs: [job],
        options: {
          page: 1,
          itemsPerPage: 10,
        },
        morePages: false,
      },
    });
    expect(wrapper.vm.pageRange).toEqual({
      first: 1,
      last: 1,
    });
    expect(wrapper.vm.serverItemsLength).toBe(1);
  });

  it('mount with options', () => {
    const wrapper = mount(JobTable, {
      localVue,
      vuetify,
      propsData: {
        jobs: [...Array(10).keys()].map(() => () => job),
        options: {
          page: 2,
          itemsPerPage: 10,
        },
        morePages: true,
      },
    });
    expect(wrapper.vm.pageRange).toEqual({
      first: 11,
      last: 20,
    });
    expect(wrapper.vm.serverItemsLength).toBe(21);
  });

  it('convert progress object to a value', () => {
    const wrapper = mount(JobTable, {
      localVue,
      vuetify,
      propsData: {
        jobs: [],
        options: {},
      },
    });
    expect(wrapper.vm.progressAsNumber(null)).toBe(100);
    expect(wrapper.vm.progressAsNumber({
      current: 50,
      total: 100,
    })).toBe(50);
  });
});
