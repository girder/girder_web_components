import axios_ from 'axios';
import Vue from 'vue';

/**
 * This is a subclass of axios that is meant to add Girder-specific helper functionality.
 */
export default class RestClient extends Vue {
  /**
   * @param {Object} [opts] Options for this instance.
   * @param {String} [opts.apiRoot="/api/v1"] The base path of the destination Girder's API
   *     (typically ending with "/api/v1").
   * @param {Object} [opts.axios]  An axios instance to use for all requests.
   */
  constructor({
    apiRoot = '/api/v1',
    axios = axios_.create(),
  } = {}) {
    super({
      data: {
        user: null,
      },
    });

    Object.assign(this, axios, { apiRoot });

    this.interceptors.request.use((config) => ({
      ...config,
      baseURL: this.apiRoot,
    }));
  }

  async fetchUser() {
    const resp = await this.get('users/me');
    if (resp.status === 204) {
      this.user = null;
    } else {
      this.user = resp.data;
    }
    return this.user;
  }
}
