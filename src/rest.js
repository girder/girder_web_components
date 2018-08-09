import axios_ from 'axios';
import cookies from 'js-cookie';
import { stringify } from 'qs';

function setCookieFromAuth(auth) {
  cookies.set('girderToken', auth.token, { expires: new Date(auth.expires) });
}

/**
 * This is a subclass of axios that is meant to add Girder-specific helper functionality.
 */
export default class RestClient {
  constructor({
    apiRoot = '/api/v1',
    token = cookies.get('girderToken'),
    axios = axios_.create(),
    cors = true,
  } = {}) {
    Object.assign(this, axios, {
      apiRoot,
      cors,
      token,
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

  async login(username, password) {
    try {
      await this.logout();
    } catch (err) {
      // noop
    }

    const resp = await this.get('user/authentication', {
      headers: {
        'Girder-Authorization': `Basic ${window.btoa(`${username}:${password}`)}`,
        'Girder-Token': null,
      },
    });
    this.token = resp.data.authToken.token;
    this.user = resp.data.user;

    if (this.cors) {
      setCookieFromAuth(resp.data.authToken);
    }
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
    this.token = resp.data.authToken.token;
    this.user = resp.data;
    if (this.cors) {
      setCookieFromAuth(resp.data.authToken);
    }
    return resp;
  }
}
