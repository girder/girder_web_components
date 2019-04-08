import MockAdapter from 'axios-mock-adapter';
import { shallowMount, mount } from '@vue/test-utils';
import RestClient from '@/rest';
import Authentication from '@/components/Authentication/Authentication.vue';
import Login from '@/components/Authentication/Login.vue';
import Register from '@/components/Authentication/Register.vue';
import Oauth from '@/components/Authentication/OAuth.vue';
import { flushPromises, girderVue } from './utils';

const localVue = girderVue();

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

  it('fetches Oauth Providers if Oauth is enabled', async () => {
    mock.onGet(/oauth\/provider/).replyOnce(200, [{
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
    await flushPromises();
    expect(wrapper.vm.oauthProviders.length).toBe(1);
  });

  it('displays OTP form if API response contains magic phrase', async () => {
    mock.onGet(/user\/authentication/).replyOnce(401, {
      message: 'User authentication must include a one-time password (typically in the "Girder-OTP" header).',
      type: 'access',
    });
    mock.onGet(/user\/authentication/).replyOnce(200, {
      message: 'Login Succeeded',
      authToken: { token: 'foo' },
      user: {},
    });
    const wrapper = mount(Login, {
      localVue,
      provide: { girderRest },
    });
    await flushPromises();
    wrapper.setData({ username: 'foo', password: 'bar' });
    await wrapper.vm.login();
    expect(wrapper.vm.otpFormVisible).toBe(true);
    wrapper.setData({ otp: 'foobar' });
    await flushPromises();
    expect(wrapper.vm.otp).toBe(''); // Test masking
    wrapper.setData({ otp: '123456' });
    await flushPromises();
    expect(wrapper.vm.otp).toBe('123456'); // Test masking
    // Validate that the username and password persist through login
    expect(wrapper.vm.username).toBe('foo');
    expect(wrapper.vm.password).toBe('bar');
    // validate that the token is cleared on success.
    await wrapper.vm.login();
    expect(wrapper.vm.password).toBe('');
    expect(wrapper.vm.otp).toBeNull();
  });
});
