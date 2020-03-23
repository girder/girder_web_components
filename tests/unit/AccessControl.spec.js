import MockAdapter from 'axios-mock-adapter';
import { parse } from 'qs';
import { shallowMount, config } from '@vue/test-utils';

import RestClient from '@/rest';
import AccessControl from '@/components/AccessControl.vue';
import GirderSearch from '@/components/Search.vue';
import { flushPromises, girderVue, vuetify } from './utils';

const localVue = girderVue();

describe('AccessControl', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  afterEach(() => {
    mock.reset();
  });

  it('intial load and change model', async () => {
    mock.onGet('/folder/fake_folder_id/access').replyOnce(200, {
      groups: [],
      users: [
        {
          flags: [],
          id: 'fake_folder_id',
          level: 2,
          login: 'girder',
          firstName: 'girder',
          lastName: 'girder',
        },
      ],
    });
    const wrapper = shallowMount(AccessControl, {
      localVue,
      vuetify,
      propsData: {
        model: {
          _id: 'fake_folder_id',
          _modelType: 'folder',
          name: 'a_folder',
          public: true,
        },
      },
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.find({ name: 'v-switch' }).props('value')).toBe(true);
    expect(wrapper.findAll({ name: 'v-list-item' }).length).toBe(1);
    expect(wrapper.find({ name: 'v-select' }).props('value')).toBe(2);

    mock.onGet('/collection/fake_collection_id/access').replyOnce(200, {
      groups: [],
      users: [],
    });
    wrapper.setProps({
      model: {
        _id: 'fake_collection_id',
        _modelType: 'collection',
        name: 'a_collection',
        public: false,
      },
    });
    await flushPromises();
    expect(wrapper.findAll({ name: 'v-list-item' }).length).toBe(0);
  });

  it('change values', async () => {
    mock.onGet('/folder/fake_folder_id/access').replyOnce(200, {
      groups: [],
      users: [],
    });

    const transitionStub = config.stubs.transition;
    // AccessConrol is using transtion but somehow the transitionStub
    // comes with @vue/test-utils causes error, disabling it makes it works
    config.stubs.transition = false;
    const wrapper = shallowMount(AccessControl, {
      localVue,
      vuetify,
      propsData: {
        model: {
          _id: 'fake_folder_id',
          _modelType: 'folder',
          name: 'a_folder',
          public: false,
        },
      },
      provide: { girderRest },
    });
    config.stubs.transition = transitionStub;
    await flushPromises();
    expect(wrapper.find({ name: 'v-switch' }).props('value')).toBe(false);
    expect(wrapper.findAll({ name: 'v-list-item' }).length).toBe(0);

    wrapper
      .findAll({ name: 'v-switch' })
      .at(0)
      .vm.$emit('input', true);
    expect(wrapper.vm.public_).toBe(true);
    const girderSearch = wrapper.find(GirderSearch).vm;
    girderSearch.$emit('select', {
      _modelType: 'user',
      _id: 'fake_user_id',
      login: 'girder',
      firstName: 'girder',
      lastName: 'girder',
    });
    girderSearch.$emit('select', {
      _modelType: 'user',
      _id: 'fake_user2_id',
      login: 'girder2',
      firstName: 'girder2',
      lastName: 'girder2',
    });
    expect(wrapper.findAll({ name: 'v-list-item' }).length).toBe(2);

    wrapper.findAll({ name: 'v-list-item' }).at(1).find({ name: 'v-btn' }).vm.$emit('click');
    expect(wrapper.findAll({ name: 'v-list-item' }).length).toBe(1);

    expect(wrapper
      .findAll({ name: 'v-select' })
      .at(0)
      .props('value')).toBe(0);
    wrapper
      .findAll({ name: 'v-select' })
      .at(0)
      .vm.$emit('input', 2);
    expect(wrapper
      .findAll({ name: 'v-select' })
      .at(0)
      .props('value')).toBe(2);

    girderSearch.$emit('select', {
      _modelType: 'group',
      _id: 'fake_group_id',
      name: 'fake group',
      description: 'fake group for testing',
    });
    expect(wrapper.findAll({ name: 'v-list-item' }).length).toBe(2);

    wrapper
      .findAll({ name: 'v-switch' })
      .at(1)
      .vm.$emit('input', true);

    mock.onPut('/folder/fake_folder_id/access').replyOnce(({ data }) => {
      const params = parse(data);
      const access = JSON.parse(params.access);
      expect(access.users.length).toBe(1);
      expect(access.users[0].level).toBe(2);
      expect(access.groups.length).toBe(1);
      expect(access.groups[0].level).toBe(0);
      expect(params.public).toBe('true');
      expect(params.recurse).toBe('true');
      return [200, {}];
    });
    await wrapper.vm.save();
    expect(wrapper.emitted('model-access-changed')).toBeTruthy();
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
