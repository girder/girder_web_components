import Vue from 'vue';
import Vuetify from 'vuetify';
import vuetifyConfig from '@/utils/vuetifyConfig';
import { createLocalVue } from '@vue/test-utils';

import Girder from '@/index';

const girderVue = () => {
  Vue.use(Girder);
  Vue.config.silent = true;
  return createLocalVue();
};

const vuetify = new Vuetify(vuetifyConfig);

function wrapMock(callback, status = 200, reply = {}) {
  return (config) => {
    try {
      callback(config);
      return [status, reply];
    } catch (err) {
      console.error(err); // eslint-disable-line no-console
      return [400];
    }
  };
}

const flushPromises = () => new Promise((resolve) => { setTimeout(resolve); });

async function authenticateRestClient(girderRest, mock) {
  mock.onGet('user/authentication').reply(200, {
    authToken: {
      expires: '2019-11-06T00:52:04.472000+00:00',
      scope: [
        'core.user_auth',
      ],
      token: 'U32630W8pJ5W5m2ZApmVOXzepGZmWeXUmQDeaxLXtwmYQdl846vaFJrqxPCxLnyM',
    },
    message: 'Login succeeded.',
    user: {
      _accessLevel: 2,
      _id: '5c6da213a49d7a13aaba2a83',
      _modelType: 'user',
      admin: true,
      created: '2019-02-20T18:53:07.075000+00:00',
      email: 'girder@g.g',
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
  });

  await girderRest.login('girder', 'girder');
  return girderRest;
}


export {
  flushPromises,
  girderVue,
  vuetify,
  wrapMock,
  authenticateRestClient,
};
