import MockAdapter from 'axios-mock-adapter';
import { shallowMount } from '@vue/test-utils';
import RestClient from '@/rest';
import DataDetails, { DefaultInfoKeys } from '@/components/DataDetails.vue';
import { flushPromises, girderVue, vuetify } from './utils';

const localVue = girderVue();

const datestring = '2018-09-18T14:39:36.074000+00:00';

function getMockEntityResponse(id, type = 'user') {
  return {
    _accessLevel: 2,
    _id: id,
    _modelType: type,
    admin: false,
    created: datestring,
    updated: datestring,
    email: 'foo@kitware.com',
    emailVerified: false,
    groupInvites: [],
    groups: [],
    meta: {},
    login: type === 'user' ? 'fake_user' : undefined,
    otp: false,
    public: true,
    size: 30558,
    name: type === 'user' ? undefined : `fake_${type}`,
    status: 'enabled',
  };
}

function getMockItemFiles() {
  return [
    {
      _id: 'fake_file_id',
      _modelType: 'file',
      assetstoreId: '5d5aec3726d3db113a117c21',
      created: datestring,
      creatorId: '5d5aebe626d3db113a117c1e',
      exts: ['csv'],
      itemId: 'fake_item_id',
      mimeType: 'text/csv',
      name: 'data.csv',
      size: 30558,
    },
  ];
}
describe('DataDetails', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  afterEach(() => {
    mock.reset();
  });

  it('displays proper info', async () => {
    mock.onGet(/item\/fake_item_id/).replyOnce(200, getMockEntityResponse('fake_item_id', 'item'));
    mock.onGet(/item\/fake_item_id\/files/).replyOnce(200, getMockItemFiles());
    const wrapper = shallowMount(DataDetails, {
      localVue,
      vuetify,
      provide: { girderRest },
      propsData: {
        infoKeys: DefaultInfoKeys,
        value: [{
          _modelType: 'item',
          _id: 'fake_item_id',
        }],
      },
    });
    await flushPromises();
    expect(wrapper.vm.title).toBe('fake_item');
    expect(wrapper.vm.icon).toBe('mdi-file');
    expect(wrapper.vm.info).toEqual([
      'Size: 29.84  KB',
      `Created on ${(new Date(datestring)).toLocaleString()}`,
      `Updated on ${(new Date(datestring)).toLocaleString()}`,
      'Unique ID: fake_item_id',
    ]);
    expect(wrapper.vm.files).toEqual(['data.csv']);
    expect(wrapper.vm.meta).toEqual([]);
    expect(wrapper.vm.actions).toHaveLength(3);
  });
});
