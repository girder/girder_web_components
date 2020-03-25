import MockAdapter from 'axios-mock-adapter';
import { shallowMount } from '@vue/test-utils';
import RestClient from '@/rest';
import Breadcrumb from '@/components/Breadcrumb.vue';
import {
  flushPromises, girderVue, vuetify, authenticateRestClient,
} from './utils';

const localVue = girderVue();

function getMockEntityResponse(id, type = 'user') {
  return {
    _accessLevel: 2,
    _id: id,
    _modelType: type,
    admin: false,
    created: '2018-09-18T14:39:36.074000+00:00',
    email: 'foo@kitware.com',
    emailVerified: false,
    groupInvites: [],
    groups: [],
    login: type === 'user' ? 'fake_user' : undefined,
    otp: false,
    public: true,
    size: 0,
    name: type === 'user' ? undefined : 'fake_collection',
    status: 'enabled',
  };
}

function getMockFolderResponse() {
  return {
    _accessLevel: 2,
    _id: 'fake_folderId',
    _modelType: 'folder',
    baseParentId: 'fake_baseParentId',
    baseParentType: 'user',
    created: '2018-09-07T19:35:02.502000+00:00',
    creatorId: 'fake_creatorId',
    description: '',
    name: 'Private',
    parentCollection: 'folder',
    parentId: 'some_parent_id',
    public: false,
    size: 104221409,
    updated: '2018-09-07T19:35:02.502000+00:00',
  };
}

function getMockRootpathResponse(parentId, parentCollection = 'user') {
  return [
    {
      object: getMockEntityResponse(parentId, parentCollection),
      type: parentCollection,
    },
    {
      object: {
        _accessLevel: 2,
        _id: 'parent_fake_folderId',
        _modelType: 'folder',
        baseParentId: parentId,
        baseParentType: parentCollection,
        created: '2018-09-07T19:35:02.502000+00:00',
        creatorId: 'fake_creatorId',
        description: '',
        name: 'Private',
        parentCollection,
        parentId,
        public: false,
        size: 104221409,
        updated: '2018-09-07T19:35:02.502000+00:00',
      },
      type: 'folder',
    },
  ];
}

describe('Breadcrumb', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  mock.onGet('folder/fake_folder_id').reply(200, getMockFolderResponse());
  mock.onGet('folder/fake_folder_id_2').reply(200, getMockFolderResponse());
  mock
    .onGet('folder/fake_folder_id/rootpath')
    .reply(200, getMockRootpathResponse('rootid', 'user'));
  mock
    .onGet('folder/fake_folder_id_2/rootpath')
    .reply(200, getMockRootpathResponse('rootid2', 'collection'));
  mock
    .onGet('user/fake_userid')
    .reply(200, getMockEntityResponse('fake_userid', 'user'));

  it('will construct the breadcrumb for a folder', async () => {
    const wrapper = shallowMount(Breadcrumb, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'folder',
          _id: 'fake_folder_id',
        },
        rootLocationDisabled: true,
      },
      provide: { girderRest },
    });
    await flushPromises();
    const { location } = wrapper.vm.$options.props;
    expect(location.required).toBeTruthy();
    expect(location.type).toBe(Object);
    expect(wrapper.vm.breadcrumb.length).toBe(3);
    expect(wrapper.vm.breadcrumb[0]._id).toBe('rootid');
    expect(wrapper.vm.breadcrumb[0]._modelType).toBe('user');
    expect(wrapper.vm.breadcrumb[0].name).toBe('fake_user');

    wrapper.vm.breadcrumb.forEach((p) => {
      expect(p.name).toBeTruthy();
    });

    // Change location, and check that DataBrowser reacts accordingly.
    wrapper.setProps({
      location: {
        _modelType: 'folder',
        _id: 'fake_folder_id_2',
      },
      rootLocationDisabled: true,
    });
    await flushPromises();
    expect(wrapper.vm.breadcrumb.length).toBe(3);
    expect(wrapper.vm.breadcrumb[0]._id).toBe('rootid2');
    expect(wrapper.vm.breadcrumb[0]._modelType).toBe('collection');
  });

  it('will construct the breadcrumb for a user', async () => {
    const wrapper = shallowMount(Breadcrumb, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'user',
          _id: 'fake_userid',
        },
        rootLocationDisabled: true,
      },
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.breadcrumb.length).toBe(1);
    expect(wrapper.vm.breadcrumb[0].name).toBe('fake_user');
  });

  it('Test with root enabled', async () => {
    const wrapper = shallowMount(Breadcrumb, {
      localVue,
      vuetify,
      propsData: {
        location: {
          type: 'root',
        },
        rootLocationDisabled: false,
      },
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.breadcrumb[0].type).toBe('root');

    wrapper.setProps({
      location: {
        type: 'collections',
      },
    });
    await flushPromises();
    expect(wrapper.vm.breadcrumb.length).toBe(2);
    expect(wrapper.vm.breadcrumb[1].type).toBe('collections');

    wrapper.setProps({
      location: {
        _modelType: 'folder',
        _id: 'fake_folder_id_2',
      },
      rootLocationDisabled: false,
    });
    await flushPromises();

    const crumbs = wrapper.vm.breadcrumb.map((r) => [r.type, r._id]);
    expect(crumbs).toEqual([
      ['root', undefined],
      ['collections', undefined],
      ['collection', 'rootid2'],
      ['folder', 'parent_fake_folderId'],
      ['folder', 'fake_folderId'],
    ]);
  });

  it('Test user root w/o authentication', async () => {
    let wrapper = shallowMount(Breadcrumb, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'user',
          _id: 'fake_userid',
        },
        rootLocationDisabled: false,
      },
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.breadcrumb.length).toBe(2);
    expect(wrapper.find('.home-button').exists()).toBe(false);

    wrapper = shallowMount(Breadcrumb, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'user',
          _id: 'fake_userid',
        },
        rootLocationDisabled: false,
      },
      provide: { girderRest: await authenticateRestClient(girderRest, mock) },
    });
    await flushPromises();
    expect(wrapper.vm.breadcrumb.length).toBe(3);
    expect(wrapper.vm.breadcrumb[1].type).toBe('users');
    expect(wrapper.find('.home-button').exists()).toBe(true);
  });
});
