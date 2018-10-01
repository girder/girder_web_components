import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuetify from 'vuetify';
import RestClient from '@/rest';
import Authentication from '@/components/Authentication/Authentication.vue';
import Register from '@/components/Authentication/Register.vue';
import Oauth from '@/components/Authentication/OAuth.vue';

const localVue = createLocalVue();
localVue.use(Vuetify);

describe('Authentication', () => {
  it('does not render children when toggled off', () => {
    const wrapper = shallowMount(Authentication, {
      localVue,
      propsData: {
        register: false,
        oauth: false,
        forgetPasswordLink: 'https://example.com/',
      },
      provide: { girderRest: new RestClient() },
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
      provide: { girderRest: new RestClient() },
    });
    expect(wrapper.contains(Register)).toBe(true);
  });

  it('fetches Oauth Providers if Oauth is enabled', (done) => {
    const get = () => Promise.resolve({
      data: [{
        id: 'foo',
        name: 'bar',
        url: 'https://example.com/',
      }],
    });
    const wrapper = shallowMount(Authentication, {
      localVue,
      propsData: {
        register: false,
        oauth: true,
        forgetPasswordLink: 'https://example.com/',
      },
      provide: { girderRest: { get } },
    });
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.oauthProviders.length).toBe(1);
      done();
    });
  });
});
