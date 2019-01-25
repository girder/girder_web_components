import MockAdapter from 'axios-mock-adapter';
import { mount } from '@vue/test-utils';
import RestClient from '@/rest';
import Register from '@/components/Authentication/Register.vue';
import { flushPromises, girderVue } from './utils';

const localVue = girderVue();
localVue.config.silent = true;

describe('Register', () => {
  const girderRest = new RestClient();
  const mock = new MockAdapter(girderRest);

  afterEach(() => {
    mock.reset();
  });

  it('Form validation', () => {
    const wrapper = mount(Register, {
      localVue,
      propsData: {},
      provide: { girderRest },
    });
    wrapper.vm.login = 'test';
    wrapper.vm.email = 'test@mail.com';
    wrapper.vm.firstName = 'test';
    wrapper.vm.lastName = 'test';
    const formWrapper = wrapper.find({ ref: 'form' });
    expect(formWrapper.vm.validate()).toBe(false);
    expect(formWrapper.vm.inputs.slice(-1)[0].valid).toBe(false);
    expect(formWrapper.vm.inputs.slice(-2)[0].valid).toBe(false);
    wrapper.vm.password = 'password';
    formWrapper.vm.validate();
    expect(formWrapper.vm.inputs.slice(-1)[0].valid).toBe(false);
    expect(formWrapper.vm.inputs.slice(-2)[0].valid).toBe(true);
    wrapper.vm.retypePassword = 'password';
    expect(formWrapper.vm.validate()).toBe(true);
  });

  it('Registration errors', async () => {
    const wrapper = mount(Register, {
      localVue,
      propsData: {},
      provide: { girderRest },
    });
    wrapper.vm.login = 'test';
    wrapper.vm.email = 'invalidemail';
    wrapper.vm.firstName = 'test';
    wrapper.vm.lastName = 'test';
    wrapper.vm.password = 'password';
    wrapper.vm.retypePassword = 'password';
    mock.onPost('user').replyOnce(400, {
      field: 'email',
      message: 'Invalid email address.',
      type: 'validation',
    });
    wrapper.find({ name: 'v-btn' }).trigger('submit');
    await flushPromises();
    expect(wrapper.find({ name: 'v-alert' }).vm.$slots.default[0].text).toEqual('Invalid email address.');

    wrapper.vm.email = 'test@email.com';
    mock.onPost('user').replyOnce(200, {
      _accessLevel: 0,
      _id: '123456789012345678901234',
      _modelType: 'user',
      admin: false,
      created: '2019-01-01T00:00:00.000000+00:00',
      firstName: 'test',
      lastName: 'test',
      login: 'test',
      public: true,
    });
    wrapper.find({ name: 'v-btn' }).trigger('submit');
    await flushPromises();
    expect(wrapper.find({ name: 'v-alert' }).vm.type).toEqual('info');
  });
});
