import axios from 'axios';
import cookies from 'js-cookie';

export default class RestClient {
  constructor(apiRoot = '/api/v1', { useCookie = true }) {
    this._axios = axios.create();
    this._axios.defaults.baseURL = apiRoot;

    if (useCookie) {
      this.token = cookies.get('girderToken');
    }
  }

  /**
   * Use this to make Web API requests.
   * @returns An Object with the same API as axios.
   */
  get request() {
    return this._axios;
  }

  get token() {
    return this._token;
  }

  set token(val) {
    this._token = val;
    if (val) {
      this._axios.defaults.headers.common['Girder-Token'] = val;
    } else {
      delete this._axios.default.headers.common['Girder-Token'];
    }
  }
}
