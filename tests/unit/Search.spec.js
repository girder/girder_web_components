import MockAdapter from 'axios-mock-adapter';
import { shallowMount } from '@vue/test-utils';
import RestClient from '@/rest';
import Search from '@/components/Search.vue';
import { flushPromises, girderVue, wrapMock as w } from './utils';

const localVue = girderVue();

function getMockSearchResult(users = 1, folders = 1, items = 1) {
  return {
    folder: (new Array(folders)).fill(null).map((_, i) => ({
      _accessLevel: 2,
      _id: `5c1d47f489f99f1a99b9dead${i}`,
      _modelType: 'folder',
      baseParentId: '5bec3b4d89f99f447cfc7005',
      baseParentType: 'user',
      created: '2018-12-21T20:07:16.136000+00:00',
      creatorId: '5bec3b4d89f99f447cfc7005',
      description: '',
      name: 'folder_name',
      parentCollection: 'user',
      parentId: '5bec3b4d89f99f447cfc7005',
      size: 0,
      updated: '2018-12-21T20:07:16.136000+00:00',
    })),
    item: (new Array(items)).fill(null).map((_, i) => ({
      _id: `5bec477d89f99f447c2bf00d${i}`,
      _modelType: 'item',
      baseParentId: '5bec3b4d89f99f447cfc7005',
      baseParentType: 'user',
      created: '2018-11-14T16:04:13.008000+00:00',
      creatorId: '5bec3b4d89f99f447cfc7005',
      description: '',
      folderId: '5bec470989f99f447c2bdddf',
      name: 'item_name.png',
      size: 1303521,
      updated: '2018-12-31T20:06:24.882000+00:00',
    })),
    user: (new Array(users)).fill(null).map((_, i) => ({
      _accessLevel: 2,
      _id: `5bec477d89f99f447c2bbeef${i}`,
      _modelType: 'user',
      admin: true,
      created: '2018-11-14T15:12:13.006000+00:00',
      email: 'john.smith@kitware.com',
      emailVerified: true,
      firstName: 'John',
      groupInvites: [],
      groups: [],
      lastName: 'Smith',
      login: 'jsmith',
      otp: false,
      public: true,
      size: 392332059,
      status: 'enabled',
    })),
  };
}


describe('Search', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  afterEach(() => {
    mock.reset();
  });

  it('can process search results', async () => {
    mock.onGet(/resource\/search/).replyOnce(w((config) => {
      expect(config.params.limit).toBe(7);
      expect(config.params.q).toBe('something');
      expect(config.params.mode).toBe('prefix');
    }, 200, getMockSearchResult()));

    const wrapper = shallowMount(Search, {
      localVue,
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.searchResults).toEqual([]);
    wrapper.setData({ searchText: 'something' });
    await flushPromises();
    expect(wrapper.vm.searchResults.length).toBe(3);
    expect(wrapper.vm.quickResults.length).toBe(3);
  });

  it('can process searchResults > maxQuickResults', async () => {
    mock.onGet(/resource\/search/).replyOnce(w((config) => {
      expect(config.params.limit).toBe(20);
    }, 200, getMockSearchResult(3, 5, 12)));

    const wrapper = shallowMount(Search, {
      localVue,
      propsData: {
        maxQuickResults: 19,
      },
      provide: { girderRest },
    });
    wrapper.setData({ searchText: 'something else' });
    await flushPromises();
    expect(wrapper.vm.searchResults.length).toBe(20);
    expect(wrapper.vm.quickResults.length).toBe(19);
  });

  it('can search with different modes and options', async () => {
    mock.onGet(/resource\/search/).replyOnce(w((config) => {
      expect(config.params.mode).toBe('text');
      expect(JSON.parse(config.params.types)).toEqual(['user', 'folder']);
    }, 200, getMockSearchResult(2, 1, 4)));

    const wrapper = shallowMount(Search, {
      localVue,
      propsData: {
        searchTypes: ['user', 'folder'],
      },
      provide: { girderRest },
    });
    await flushPromises();
    wrapper.setData({
      searchMode: 'text',
      searchText: 'a third thing',
    });
    await flushPromises();
    // Expect 3 because Search.vue filters out results not in searchTypes.
    expect(wrapper.vm.searchResults.length).toBe(3);
    expect(wrapper.vm.quickResults.length).toBe(3);
  });
});
