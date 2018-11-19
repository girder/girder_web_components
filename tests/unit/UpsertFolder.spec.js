import MockAdapter from 'axios-mock-adapter';
import { shallowMount } from '@vue/test-utils';
import RestClient from '@/rest';
import UpsertFolder from '@/components/UpsertFolder.vue';
import { flushPromises, girderVue } from './utils';

const localVue = girderVue();

function getMockFolderResponse(parentId, parentCollection = 'user') {
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
    parentCollection,
    parentId,
    public: false,
    size: 104221409,
    updated: '2018-09-07T19:35:02.502000+00:00',
  };
}

describe('Upsert Folder', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  afterEach(() => {
    mock.reset();
  });

  it('can create new folders', async () => {
    const name = 'Folder 1';
    const description = 'Description foo';
    const parentType = 'user';
    const parentId = 'fake_user_id';
    const qString = `parentType=${parentType}&parentId=${parentId}&name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&reuseExisting=false`;
    mock.onPost(/folder/).reply((config) => {
      // If the following fails, it doesn't throw a useful error.
      // You might see `TypeError: Cannot read property 'status' of undefined`
      expect(config.data).toBe(qString);
      return [200, {}];
    });
    const wrapper = shallowMount(UpsertFolder, {
      localVue,
      propsData: {
        location: {
          type: parentType,
          id: parentId,
        },
        edit: false,
      },
      provide: { girderRest },
    });
    await flushPromises();
    const { location } = wrapper.vm.$options.props;
    expect(location.required).toBeTruthy();
    expect(location.type).toBe(Object);
    wrapper.setData({ name, description });
    expect(wrapper.emitted().done).toBeFalsy();
    await wrapper.vm.upsert();
    await flushPromises();
    expect(wrapper.emitted().done).toBeTruthy();
  });

  it('can update existing folders', async () => {
    const NEW_DESCRIPTION = 'Something else';
    const NEW_NAME = 'Fake Folder Updated';
    const qString = `name=${encodeURIComponent(NEW_NAME)}&description=${encodeURIComponent(NEW_DESCRIPTION)}`;
    const parentType = 'folder';
    const parentId = 'fake_folder_id';
    mock.onGet(/folder\/fake_folder_id/)
      .replyOnce(200, getMockFolderResponse('fake_folder_parent', 'folder'));
    mock.onPut(/folder\/fake_folder_id/)
      .replyOnce((config) => {
        // If the following fails, it doesn't throw a useful error.
        // You might see `TypeError: Cannot read property 'status' of undefined`
        expect(config.data).toBe(qString);
        return [200, {}];
      });
    const wrapper = shallowMount(UpsertFolder, {
      localVue,
      propsData: {
        location: {
          type: parentType,
          id: parentId,
        },
        edit: true,
      },
      provide: { girderRest },
    });
    await flushPromises();
    expect(wrapper.vm.name).toBe('Private');
    expect(wrapper.vm.description).toBe('');

    expect(wrapper.emitted().done).toBeFalsy();
    wrapper.setData({
      name: NEW_NAME,
      description: NEW_DESCRIPTION,
    });
    await wrapper.vm.upsert();
    await flushPromises();
    expect(wrapper.emitted().done).toBeTruthy();
  });
});
