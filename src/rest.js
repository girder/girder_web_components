import axios_ from 'axios';
import cookies from 'js-cookie';
import { stringify } from 'qs';
import Vue from 'vue';

function setCookieFromAuth(auth) {
  cookies.set('girderToken', auth.token, { expires: new Date(auth.expires) });
}

/**
 * This is a subclass of axios that is meant to add Girder-specific helper functionality.
 */
export default class RestClient extends Vue {
  constructor({
    apiRoot = '/api/v1',
    token = cookies.get('girderToken'),
    axios = axios_.create(),
    cors = true,
  } = {}) {
    super({
      data: {
        user: null,
        token,
      },
    });

    Object.assign(this, axios, {
      apiRoot,
      cors,
    });

    this.interceptors.request.use(config => ({
      ...config,
      baseURL: this.apiRoot,
      headers: {
        'Girder-Token': this.token,
        ...config.headers,
      },
    }));
  }

  async login(username, password, otp = null) {
    try {
      await this.logout();
    } catch (err) {
      // noop
    }

    const headers = {
      'Girder-Authorization': `Basic ${window.btoa(`${username}:${password}`)}`,
      'Girder-Token': null,
    };
    if (otp) {
      headers['Girder-OTP'] = otp;
    }
    const resp = await this.get('user/authentication', { headers });
    this.token = resp.data.authToken.token;
    this.user = resp.data.user;

    if (this.cors) {
      setCookieFromAuth(resp.data.authToken);
    }
    this.$emit('login', this.user);
    return resp;
  }

  async logout() {
    if (!this.token) {
      return;
    }
    try {
      await this.delete('user/authentication');
    } catch (err) {
      if (err.response.status !== 401) {
        throw err;
      }
    } finally {
      this.token = null;
      this.user = null;
      cookies.remove('girderToken');
      this.$emit('logout');
    }
  }

  async fetchUser() {
    const resp = await this.get('user/me');
    this.user = resp.data;
    if (this.user === null) {
      this.token = null;
    }
    return this.user;
  }

  async register(login, email, firstName, lastName, password, admin = false) {
    const resp = await this.post('user', stringify({
      login, email, firstName, lastName, password, admin,
    }));
    if (!resp.data.authToken) {
      return resp;
    }
    this.token = resp.data.authToken.token;
    this.user = resp.data;
    if (this.cors) {
      setCookieFromAuth(resp.data.authToken);
    }
    this.$emit('register', this.user);
    this.$emit('login', this.user);
    return resp;
  }
}
