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

  describe('own owner access', () => {
    const mountAs = async (user, access) => {
      girderRest.user = user;
      mock.onGet('/folder/fake_folder_id/access').replyOnce(200, access);
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
      await flushPromises();
      return wrapper;
    };
    const me = {
      _id: 'my_id', login: 'me', admin: false, groups: ['my_group_id'],
    };
    const entry = (id, level) => ({
      flags: [], id, level, name: id,
    });

    afterEach(() => {
      girderRest.user = null;
    });

    it('asks for confirmation before saving a demotion of self', async () => {
      const wrapper = await mountAs(me, {
        groups: [],
        users: [entry('my_id', 2), entry('other_id', 2)],
      });
      expect(wrapper.vm.losingOwnership).toBe(false);
      expect(wrapper.find('.owner-loss-warning').exists()).toBe(false);

      wrapper.vm.access.users[0].level = 1;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.losingOwnership).toBe(true);
      expect(wrapper.find('.owner-loss-warning').exists()).toBe(true);

      // Saving only opens the confirmation; no request is made
      await wrapper.vm.save();
      expect(wrapper.vm.confirmOwnerLoss).toBe(true);
      expect(mock.history.put.length).toBe(0);
      expect(wrapper.emitted('close')).toBeFalsy();

      mock.onPut('/folder/fake_folder_id/access').replyOnce(200, {});
      await wrapper.vm.confirmSave();
      expect(wrapper.vm.confirmOwnerLoss).toBe(false);
      expect(mock.history.put.length).toBe(1);
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('warns when removing self', async () => {
      const wrapper = await mountAs(me, {
        groups: [],
        users: [entry('my_id', 2)],
      });
      wrapper.vm.remove(wrapper.vm.access.users[0]);
      expect(wrapper.vm.losingOwnership).toBe(true);
    });

    it('does not warn while a group still grants owner access', async () => {
      const wrapper = await mountAs(me, {
        groups: [entry('my_group_id', 2)],
        users: [entry('my_id', 2)],
      });
      wrapper.vm.remove(wrapper.vm.access.users[0]);
      expect(wrapper.vm.losingOwnership).toBe(false);
      wrapper.vm.access.groups[0].level = 0;
      expect(wrapper.vm.losingOwnership).toBe(true);
    });

    it('does not warn site admins or changes to other users', async () => {
      let wrapper = await mountAs({ ...me, admin: true }, {
        groups: [],
        users: [entry('my_id', 2)],
      });
      wrapper.vm.remove(wrapper.vm.access.users[0]);
      expect(wrapper.vm.losingOwnership).toBe(false);

      wrapper = await mountAs(me, {
        groups: [],
        users: [entry('my_id', 2), entry('other_id', 2)],
      });
      wrapper.vm.remove(wrapper.vm.access.users[1]);
      expect(wrapper.vm.losingOwnership).toBe(false);
      mock.onPut('/folder/fake_folder_id/access').replyOnce(200, {});
      await wrapper.vm.save();
      expect(mock.history.put.length).toBe(1);
    });
  });
});
