import MockAdapter from 'axios-mock-adapter';
import { shallowMount } from '@vue/test-utils';
import RestClient from '@/rest';
import DataBrowser from '@/components/DataBrowser.vue';
import { flushPromises, girderVue, vuetify, authenticateRestClient } from './utils';

const localVue = girderVue();

function getMockFolderResponse(parentId, parentCollection = 'user') {
  return {
    _accessLevel: 2,
    _id: 'fake_folder_id',
    _modelType: 'folder',
    baseParentId: 'fake_baseParentId',
    baseParentType: 'user',
    created: '2018-09-07T19:35:02.502000+00:00',
    creatorId: 'fake_creatorId',
    description: '',
    name: 'Private',
    parentCollection,
    parentId,
    public: false,
    size: 104221409,
    updated: '2018-09-07T19:35:02.502000+00:00',
  };
}

function getMockFolderQueryResponse(count = 1) {
  return (new Array(count)).fill(getMockFolderResponse());
}

function getMockItemResponse() {
  return {
    baseParentId: 'fake_baseParentId',
    baseParentType: 'user',
    created: '2018-10-10T13:23:54.490000+00:00',
    creatorId: 'fake_creatorId',
    description: '',
    folderId: '5bb3b5c289f99f5de63c8295',
    name: 'activity_group_Joining_Queue_073,61.json',
    size: 848,
    updated: '2018-10-10T13:23:54.490000+00:00',
    _id: 'fake_itemId',
    _modelType: 'item',
  };
}

function getMockItemQueryResponse(count = 1) {
  return (new Array(count)).fill(getMockItemResponse());
}

describe('DataBrowser', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  afterEach(() => {
    mock.reset();
  });

  it('can handle normal navigation', async () => {
    mock.onGet(/user\/foo_user_id\/details/).replyOnce(200, { nFolders: 1 });
    mock.onGet(/folder\/fake_folder_id\/details/).replyOnce(200, { nFolders: 1, nItems: 1 });
    mock.onGet('folder').reply(200, getMockFolderQueryResponse(1));
    mock.onGet('folder/fake_folder_id').replyOnce(200, getMockFolderResponse());
    mock.onGet(/item/).reply(200, getMockItemQueryResponse(1));
    const wrapper = shallowMount(DataBrowser, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'user',
          _id: 'foo_user_id',
        },
      },
      provide: { girderRest },
    });
    await flushPromises();
    const { location } = wrapper.vm.$options.props;
    expect(location.required).toBe(true);
    expect(location.type).toBe(Object);
    expect(wrapper.vm.rows.length).toBe(1);

    // Change location, and check that DataBrowser reacts accordingly.
    wrapper.setProps({
      location: {
        _modelType: 'folder',
        _id: 'fake_folder_id',
      },
    });
    await flushPromises();
    expect(wrapper.vm.location._modelType).toBe('folder');
    expect(wrapper.vm.rows.length).toBe(2); // 1 folder, 1 item
  });

  it('can handle paginated requests (folders + items)', async () => {
    mock.onGet(/folder\/fake_folder_id\/details/).reply(200, { nFolders: 12, nItems: 20 });
    mock.onGet(/item/, {
      params: {
        limit: 8,
        offset: 0,
        folderId: 'fake_folder_id',
      },
    }).replyOnce(200, getMockItemQueryResponse(8));
    mock.onGet('folder', {
      params: {
        limit: 10,
        offset: 10,
        parentId: 'fake_folder_id',
        parentType: 'folder',
      },
    }).replyOnce(200, getMockFolderQueryResponse(2));
    mock.onGet('folder/fake_folder_id').replyOnce(200, getMockFolderResponse());

    const wrapper = shallowMount(DataBrowser, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'folder',
          _id: 'fake_folder_id',
        },
      },
      data: () => ({
        options: {
          itemsPerPage: 10,
          page: 2,
        },
      }),
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.rows.length).toBe(10);
    expect(wrapper.vm.rows[1]._modelType).toBe('folder');
    expect(wrapper.vm.rows[2]._modelType).toBe('item');
  });

  it('can handle paginated requests (items after folders)', async () => {
    mock.onGet(/folder\/fake_folder_id\/details/).reply(200, { nFolders: 12, nItems: 20 });
    mock.onGet(/item/, {
      params: {
        limit: 10,
        offset: 8,
        folderId: 'fake_folder_id',
      },
    }).replyOnce(200, getMockItemQueryResponse(10));
    mock.onGet('folder', {
      params: {
        limit: 10,
        offset: 20,
        parentId: 'fake_folder_id',
        parentType: 'folder',
      },
    }).replyOnce(200, []);
    mock.onGet('folder/fake_folder_id').replyOnce(200, getMockFolderResponse());

    const wrapper = shallowMount(DataBrowser, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'folder',
          _id: 'fake_folder_id',
        },
      },
      data: () => ({
        options: {
          itemsPerPage: 10,
          page: 3,
        },
      }),
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.rows.length).toBe(10);
    wrapper.vm.rows.forEach((row) => {
      expect(row._modelType).toBe('item');
    });
  });

  it('can handle requests without options', async () => {
    mock.onGet(/folder\/fake_folder_id\/details/).reply(200, { nFolders: 12, nItems: 20 });
    mock.onGet(/item/, {
      params: {
        limit: null,
        offset: 0,
        folderId: 'fake_folder_id',
      },
    }).replyOnce(200, getMockItemQueryResponse(20));
    mock.onGet(/folder/, {
      params: {
        limit: null,
        offset: 0,
        parentId: 'fake_folder_id',
        parentType: 'folder',
      },
    }).replyOnce(200, getMockFolderQueryResponse(12));
    mock.onGet('folder/fake_folder_id').replyOnce(200, getMockFolderResponse());

    const wrapper = shallowMount(DataBrowser, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'folder',
          _id: 'fake_folder_id',
        },
      },
      data: () => ({
        options: {
          itemsPerPage: -1,
          page: 1,
        },
      }),
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.rows.length).toBe(32);
  });

  it('populates 2 rows for root location', async () => {
    let wrapper = shallowMount(DataBrowser, {
      localVue,
      vuetify,
      provide: { girderRest },
      propsData: {
        location: {
          type: 'root',
        },
        rootLocationDisabled: false,
      },
    });

    await flushPromises();
    expect(wrapper.vm.rows.length).toBe(1);
    expect(wrapper.vm.rows[0]._modelType).toBe('collections');

    const girderRest_ = new RestClient();
    const mock_ = new MockAdapter(girderRest_);
    wrapper = shallowMount(DataBrowser, {
      localVue,
      vuetify,
      provide: {
        girderRest: await authenticateRestClient(girderRest_, mock_),
      },
      propsData: {
        location: {
          type: 'root',
        },
        rootLocationDisabled: false,
      },
    });

    await flushPromises();
    expect(wrapper.vm.rows.length).toBe(2);
    expect(wrapper.vm.rows[0]._modelType).toBe('collections');
    expect(wrapper.vm.rows[1]._modelType).toBe('users');
  });

  it('users locations', async () => {
    const girderRest_ = new RestClient();
    const mock_ = new MockAdapter(girderRest_);
    mock_.onGet('user/details').reply(200, { nUsers: 1 });
    mock_
      .onGet('user', {
        params: {
          limit: 10,
          offset: 0,
        },
      })
      .reply(200, [
        {
          _accessLevel: 2,
          _id: 'fake_user_id',
          _modelType: 'user',
          admin: true,
          created: '2019-03-14T14:03:02.636000+00:00',
          email: 'girder@email.com',
          emailVerified: true,
          firstName: 'girder',
          groupInvites: [],
          groups: [],
          lastName: 'girder',
          login: 'girder',
          otp: false,
          public: true,
          size: 0,
          status: 'enabled',
        },
      ]);

    const wrapper = shallowMount(DataBrowser, {
      localVue,
      vuetify,
      provide: { girderRest: await authenticateRestClient(girderRest_, mock_) },
      propsData: {
        location: {
          type: 'users',
        },
        rootLocationDisabled: false,
        foo: 'bar',
      },
    });

    await flushPromises();
    expect(wrapper.vm.location.type).toBe('users');
    expect(wrapper.vm.rows.length).toBe(1);
    expect(wrapper.vm.rows[0]._modelType).toBe('user');
  });

  it('page size props', async () => {
    mock.onGet(/folder\/fake_folder_id\/details/).reply(200, { nFolders: 12, nItems: 20 });
    mock.onGet(/folder/, {
      params: {
        limit: 20,
        offset: 0,
        parentId: 'fake_folder_id',
        parentType: 'folder',
      },
    }).replyOnce(200, getMockFolderQueryResponse(12));
    mock.onGet('folder/fake_folder_id').replyOnce(200, getMockFolderResponse());

    mock.onGet(/item/, {
      params: {
        limit: 8,
        offset: 0,
        folderId: 'fake_folder_id',
      },
    }).replyOnce(200, getMockItemQueryResponse(8));

    const wrapper = shallowMount(DataBrowser, {
      localVue,
      vuetify,
      propsData: {
        location: {
          _modelType: 'folder',
          _id: 'fake_folder_id',
        },
        initialItemsPerPage: 20,
        itemsPerPageOptions: [20, 30, 40, -1],
      },
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.rows.length).toBe(20);
    expect(wrapper.find('girder-data-table-stub').props('itemsPerPageOptions')).toEqual([20, 30, 40, -1]);
  });
});
