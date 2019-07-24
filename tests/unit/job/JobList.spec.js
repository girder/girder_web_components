import Vue from 'vue';
import { shallowMount } from '@vue/test-utils';
import MockAdapter from 'axios-mock-adapter';
import RestClient from '@/rest';
import JobList from '@/components/Job/JobList.vue';

import { girderVue } from '../utils';

const localVue = girderVue();

const job = {
  title: 'job',
  type: 'type',
  updated: '2000-01-01T05:00:00.000',
  status: 3,
};

describe('JobList.vue', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);
  const notificationBus = new Vue();
  let app;

  async function waitForResponses(wrapper) {
    await Promise.all([ /* eslint-disable no-underscore-dangle */
      wrapper.vm._async_computed$jobs,
      wrapper.vm._async_computed$typeAndStatusList,
      wrapper.vm.$nextTick(),
    ]);
  }

  async function mountAndWait(options = {}) {
    const wrapper = shallowMount(JobList, Object.assign({
      localVue,
      provide: { girderRest, notificationBus },
    }, options));
    await waitForResponses(wrapper);
    return wrapper;
  }

  beforeEach(() => {
    app = document.createElement('div');
    app.setAttribute('data-app', true);
    document.body.appendChild(app);
    // localVue = createGirderVue();
    // mock = localVue.prototype.$mock;
  });
  afterEach(() => {
    document.body.removeChild(app);
    // mock = null;
    // localVue = null;
    mock.reset();
  });

  it('mount with no jobs', async () => {
    mock.onGet(/job[^/]/).reply(200, []);
    mock.onGet(/typeandstatus$/).reply(200, {
      statuses: [],
      types: [],
    });

    const wrapper = await mountAndWait(JobList);
    expect(wrapper.vm.jobs).toEqual([]);
    expect(wrapper.vm.morePages).toBe(false);
    expect(wrapper.vm.typeAndStatusList).toEqual({
      statuses: [],
      types: [],
    });
  });

  it('mount with one job', async () => {
    mock.onGet(/job[^/]/).reply(200, [job]);
    mock.onGet(/typeandstatus$/).reply(200, {
      statuses: [0, 1],
      types: ['type 1', 'type 2'],
    });

    const wrapper = await mountAndWait(JobList);
    expect(wrapper.vm.jobs).toEqual([job]);
    expect(wrapper.vm.morePages).toBe(false);
    expect(wrapper.vm.typeAndStatusList).toEqual({
      statuses: [0, 1],
      types: ['type 1', 'type 2'],
    });
  });

  it('mount with pagination', async () => {
    mock.onGet(/job[^/]/).reply(200, [...Array(11).keys()].map(() => () => job));
    mock.onGet(/typeandstatus$/).reply(200, {
      statuses: [0, 1],
      types: ['type 1', 'type 2'],
    });

    const wrapper = await mountAndWait(JobList);
    wrapper.vm.pagination.rowsPerPage = 10;
    expect(wrapper.vm.jobs.length).toBe(10);
    expect(wrapper.vm.morePages).toBe(true);
  });

  it('responds to filter changes', async () => {
    mock.onGet(/job[^/]/).reply(200, [...Array(11).keys()].map(() => () => job));
    mock.onGet(/typeandstatus$/).reply(200, {
      statuses: [0, 1],
      types: ['type 1', 'type 2'],
    });

    const wrapper = await mountAndWait(JobList);

    wrapper.vm.pagination.page = 2;
    await waitForResponses(wrapper);

    mock.resetHistory();
    wrapper.vm.jobFilter = {
      status: 0,
      jobType: 'type 1',
    };
    await waitForResponses(wrapper);
    expect(mock.history.get.length).toBe(1);
    expect(mock.history.get[0].url).toMatch(/statuses=%5B0%5D/);
    expect(mock.history.get[0].url).toMatch(/types=%5B%22type%201%22%5D/);
    expect(wrapper.vm.pagination.page).toBe(1);
  });

  it('responds to pagination changes', async () => {
    mock.onGet(/job[^/]/).reply(200, [...Array(11).keys()].map(() => () => job));
    mock.onGet(/typeandstatus$/).reply(200, {
      statuses: [0, 1],
      types: ['type 1', 'type 2'],
    });

    const wrapper = await mountAndWait(JobList);

    mock.resetHistory();
    wrapper.vm.pagination = {
      rowsPerPage: 10,
      page: 3,
      sortBy: 'title',
      descending: false,
    };
    await waitForResponses(wrapper);

    expect(mock.history.get.length).toBe(1);
    expect(mock.history.get[0].url).toMatch(/limit=11/);
    expect(mock.history.get[0].url).toMatch(/offset=20/);
    expect(mock.history.get[0].url).toMatch(/sort.*title/);
    expect(mock.history.get[0].url).toMatch(/sortdir=1/);
  });

  it('default sort order', async () => {
    mock.onGet(/job[^/]/).reply(200, [...Array(11).keys()].map(() => () => job));
    mock.onGet(/typeandstatus$/).reply(200, {
      statuses: [0, 1],
      types: ['type 1', 'type 2'],
    });

    const wrapper = await mountAndWait(JobList);

    mock.resetHistory();
    wrapper.vm.pagination = {
      rowsPerPage: 10,
      page: 3,
    };
    await waitForResponses(wrapper);

    expect(mock.history.get.length).toBe(1);
    expect(mock.history.get[0].url).not.toMatch(/sort/);
  });

  it('updates on job notifications', async () => {
    mock.onGet(/job[^/]/).reply(200, [job]);
    mock.onGet(/typeandstatus$/).reply(200, {
      statuses: [],
      types: [],
    });

    const wrapper = await mountAndWait(JobList);
    const spy = jest.spyOn(wrapper.vm, 'refreshJobList');

    notificationBus.$emit('message:job_status');
    expect(spy).toHaveBeenCalledTimes(1);

    notificationBus.$emit('message:job_created');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('refresh fetches server', async () => {
    mock.onGet(/job[^/]/).reply(200, [job]);
    mock.onGet(/typeandstatus$/).reply(200, {
      statuses: [],
      types: [],
    });

    const wrapper = await mountAndWait(JobList);
    const fetchCount = mock.history.get.length;
    wrapper.vm.refreshJobList();
    await waitForResponses(wrapper);

    expect(mock.history.get.length).toBeGreaterThan(fetchCount);
  });
});
