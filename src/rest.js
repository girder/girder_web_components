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
   * Register a callback function that will be called on error responses.
   * @param {Function} fn The function to be called. The callback will receive
   *     a single argument, an axios error object. If you wish to ignore the
   *     error, return a value. If you wish to propagate the error, return
   *     a rejected Promise with the original argument.
   */
  onErrorResponse(fn) {
    this._axios.interceptors.response.use(undefined, fn);
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
