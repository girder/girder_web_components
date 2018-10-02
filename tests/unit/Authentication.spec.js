import MockAdapter from 'axios-mock-adapter';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import RestClient from '@/rest';
import Authentication from '@/components/Authentication/Authentication.vue';
import Register from '@/components/Authentication/Register.vue';
import Oauth from '@/components/Authentication/OAuth.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);

describe('Authentication', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  afterEach(() => {
    mock.reset();
  });

  it('does not render children when toggled off', () => {
    const wrapper = shallowMount(Authentication, {
      localVue,
      propsData: {
        register: false,
        oauth: false,
        forgetPasswordLink: 'https://example.com/',
      },
      provide: { girderRest: {} },
    });
    expect(wrapper.contains(Register)).toBe(false);
    expect(wrapper.contains(Oauth)).toBe(false);
  });

  it('renders registration when toggled on', () => {
    const wrapper = shallowMount(Authentication, {
      localVue,
      propsData: {
        register: true,
        oauth: false,
        forgetPasswordLink: 'https://example.com/',
      },
      provide: { girderRest: {} },
    });
    expect(wrapper.contains(Register)).toBe(true);
  });

// https://github.com/girder/girder_web_components/pull/17#discussion_r222040969
/*
  it('fetches Oauth Providers if Oauth is enabled', async () => {
    mock.onGet(/oauth/).replyOnce(200, [{
      id: 'test',
      name: 'Test OAuth Provider',
      url: 'https://testprovider.com/',
    }]);
    const wrapper = shallowMount(Authentication, {
      localVue,
      propsData: {
        register: false,
        oauth: true,
        forgetPasswordLink: 'https://example.com/',
      },
      provide: { girderRest },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.oauthProviders.length).toBe(1);
  });
*/
});
