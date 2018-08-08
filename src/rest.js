import axios_ from 'axios';
import cookies from 'js-cookie';

/**
 * This is a subclass of axios that is meant to add Girder-specific helper functionality.
 */
export default class RestClient {
  constructor({ apiRoot = '/api/v1', token = cookies.get('girderToken'), axios = axios_.create() } = {}) {
    Object.assign(this, axios, {
      apiRoot,
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
}
