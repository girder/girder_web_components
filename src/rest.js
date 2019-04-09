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
  /**
   * @param {Object} [opts] Options for this instance.
   * @param {String} [opts.apiRoot="/api/v1"] The base path of the destination Girder's API
   *     (typically ending with "/api/v1").
   * @param {String} [opts.token] An initial value for the authentication token.
   * @param {Object} [opts.axios]  An axios instance to use for all requests.
   * @param {Boolean} [opts.setLocalCookie=true] Whether to set the authentication token to a local
   *     cookie (via Javascript) after login to a server.
   */
  constructor({
    apiRoot = '/api/v1',
    token = cookies.get('girderToken'),
    axios = axios_.create(),
    setLocalCookie = true,
  } = {}) {
    super({
      data: {
        user: null,
        token,
      },
    });

    Object.assign(this, axios, {
      apiRoot,
      setLocalCookie,
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

    if (this.setLocalCookie) {
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
    if (this.setLocalCookie) {
      setCookieFromAuth(resp.data.authToken);
    }
    this.$emit('register', this.user);
    this.$emit('login', this.user);
    return resp;
  }
}
