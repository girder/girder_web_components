import MockAdapter from 'axios-mock-adapter';
import { shallowMount } from '@vue/test-utils';
import RestClient from '@/rest';
import Breadcrumb from '@/components/Breadcrumb.vue';
import { flushPromises, girderVue } from './utils';

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
    {
      object: getMockEntityResponse(parentId, parentCollection),
      type: parentCollection,
    },
  ];
}

describe('Breadcrumb', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  afterEach(() => {
    mock.reset();
  });

  it('will construct the breadcrumb for a folder', async () => {
    mock.onGet(/folder\/fake_folder_id/).replyOnce(200, getMockFolderResponse());
    mock.onGet(/folder\/fake_folder_id_2/).replyOnce(200, getMockFolderResponse());
    mock.onGet(/folder\/fake_folder_id\/rootpath/).replyOnce(200, getMockRootpathResponse('rootid', 'user'));
    mock.onGet(/folder\/fake_folder_id_2\/rootpath/).replyOnce(200, getMockRootpathResponse('rootid2', 'collection'));
    const wrapper = shallowMount(Breadcrumb, {
      localVue,
      propsData: {
        location: {
          type: 'folder',
          id: 'fake_folder_id',
        },
      },
      provide: { girderRest },
    });
    await flushPromises();
    const { location } = wrapper.vm.$options.props;
    expect(location.required).toBeTruthy();
    expect(location.type).toBe(Object);
    expect(wrapper.vm.breadcrumb.path.length).toBe(2);
    expect(wrapper.vm.breadcrumb.root.id).toBe('rootid');
    expect(wrapper.vm.breadcrumb.root.type).toBe('user');
    expect(wrapper.vm.breadcrumb.root.name).toBe('fake_user');

    wrapper.vm.breadcrumb.path.forEach((p) => {
      expect(p.name).toBeTruthy();
    });

    // Change location, and check that DataBrowser reacts accordingly.
    wrapper.setProps({
      location: {
        type: 'folder',
        id: 'fake_folder_id_2',
      },
    });
    await flushPromises();
    expect(wrapper.vm.breadcrumb.path.length).toBe(2);
    expect(wrapper.vm.breadcrumb.root.id).toBe('rootid2');
    expect(wrapper.vm.breadcrumb.root.type).toBe('collection');
  });

  it('will construct the breadcrumb for a user', async () => {
    mock.onGet(/user\/fake_userid/).replyOnce(200, getMockEntityResponse('fake_userid', 'user'));
    const wrapper = shallowMount(Breadcrumb, {
      localVue,
      propsData: {
        location: {
          type: 'user',
          id: 'fake_userid',
        },
      },
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.breadcrumb.root.name).toBe('fake_user');
  });
});
