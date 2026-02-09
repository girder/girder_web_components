import axios_ from 'axios'
import cookies from 'js-cookie'
import { stringify } from 'qs'
import mitt from 'mitt'

const GirderTokenLength = 64
export const OauthTokenPrefix = '#girderToken='
export const OauthTokenSuffix = '__'

// Girder headers
const GirderToken = 'Girder-Token'
const GirderOtp = 'Girder-OTP'
const GirderAuthorization = 'Girder-Authorization'

function setCookieFromAuth(auth) {
  cookies.set('girderToken', auth.token, { expires: new Date(auth.expires) })
}

function setCookieFromHash(location) {
  const arr = location.hash.split(OauthTokenPrefix)
  const token = arr[arr.length - 1].split(OauthTokenSuffix)[0]
  if (token.length === GirderTokenLength) {
    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    setCookieFromAuth({ token, expires })
    location.hash = location.hash.replace(`${OauthTokenPrefix}${token}${OauthTokenSuffix}`, '')
  }
  return token
}

export default class RestClient {
  constructor({
    apiRoot = '/api/v1',
    token = cookies.get('girderToken') || setCookieFromHash(window.location),
    axios = axios_.create(),
    authenticateWithCredentials = false,
    useGirderAuthorizationHeader = false,
    setLocalCookie = true,
  } = {}) {
    this.apiRoot = apiRoot;
    this.token = token;
    this.user = null;

    this.setLocalCookie = setLocalCookie;
    this.authenticateWithCredentials = authenticateWithCredentials;
    this.useGirderAuthorizationHeader = useGirderAuthorizationHeader;

    this._axios = axios.create();
    this.emitter = mitt();

    this._axios.interceptors.request.use((config) => ({
      ...config,
      baseURL: this.apiRoot,
      headers: {
        [GirderToken]: this.token,
        ...config.headers,
      },
    }));

    ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    this[method] = (...args) => {
      if (this.apiRoot) {
        return this._axios[method](...args);
      }
    };
});
  }

  on(event, handler) {
    this.emitter.on(event, handler);
  }

  off(event, handler) {
    this.emitter.off(event, handler);
  }

  emit(event, payload) {
    this.emitter.emit(event, payload);
  }

  async setApiRoot(apiRoot) {
    await this.logout();
    this.apiRoot = apiRoot;
    this.emit('apiRootUpdated', this.apiRoot);
  }

  async login(username, password, otp = null) {
    try {
      await this.logout();
    } catch (_err) {
      // noop
    }

    let auth;
    const headers = { [GirderToken]: null };

    if (this.useGirderAuthorizationHeader) {
      headers[GirderAuthorization] = `Basic ${window.btoa(`${username}:${password}`)}`;
    } else {
      auth = { username, password };
    }
    if (otp) {headers[GirderOtp] = otp;}

    const resp = await this.get('user/authentication', {
      headers,
      auth,
      withCredentials: this.authenticateWithCredentials,
    });

    this.token = resp.data.authToken.token;
    this.user = resp.data.user;

    if (this.setLocalCookie) {setCookieFromAuth(resp.data.authToken);}
    this.emit('userLoggedIn', this.user);
    return resp;
  }

  async logout() {
    if (!this.token) {return;}
    try {
      await this.delete('user/authentication');
    } catch (err) {
      if (!err.response || err.response.status !== 401) {throw err;}
    } finally {
      this.token = null;
      this.user = null;
      cookies.remove('girderToken');
      this.emit('userLoggedOut');
    }
  }

  async fetchUser() {
    const resp = await this.get('user/me');
    this.user = resp.data;
    if (this.user === null) {this.token = null;}
    this.emit('userFetched');
    return this.user;
  }

  async register(login, email, firstName, lastName, password, admin = false) {
    const resp = await this.post(
      'user',
      stringify({ login, email, firstName, lastName, password, admin })
    );

    if (!resp.data.authToken) {return resp;}

    this.token = resp.data.authToken.token;
    this.user = resp.data;
    if (this.setLocalCookie) {setCookieFromAuth(resp.data.authToken);}
    this.emit('userRegistered', this.user);
    this.emit('userLoggedIn', this.user);
    return resp;
  }
}