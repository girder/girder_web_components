import { getCurrentScope, inject, onScopeDispose, ref, shallowRef } from 'vue';

const OTP_MAGIC_SUBSTRING = 'authentication must include a one-time password';
const USER_EVENTS = [
  'userLoggedIn',
  'userLoggedOut',
  'userRegistered',
  'userFetched',
  'apiRootUpdated',
];

/**
 * Headless state and actions for logging in and out of Girder.
 *
 * Form validation is left to the caller: `login()` sends the current
 * credentials as they are.
 *
 * `login()` resolves to:
 * - `'success'` when the user is logged in;
 * - `'otp'` when Girder requires a one-time password: `otpRequired` becomes
 *   true and `login()` must be called again with `otp` set;
 * - `'error'` when the credentials are rejected: the message is in `alerts.error`.
 * Unexpected errors are rethrown.
 *
 * @param {Object} [params]
 * @param {import('@/utils/restClient').default} [params.rest]
 *   Girder REST client. Defaults to the client provided by the plugin.
 */
export default function useGirderLogin({ rest } = {}) {
  const injected = rest ? null : inject('girder', null);
  const client = rest || injected?.rest;
  if (!client) {
    throw new Error('useGirderLogin: no Girder REST client was provided or injected');
  }

  let user = injected?.user;
  if (!user) {
    user = shallowRef(client.user);
    const sync = () => {
      user.value = client.user;
    };
    USER_EVENTS.forEach((event) => client.on(event, sync));
    if (getCurrentScope()) {
      onScopeDispose(() => USER_EVENTS.forEach((event) => client.off(event, sync)));
    }
  }

  // ---- State ----
  const username = ref('');
  const password = ref('');
  const otp = ref(null);
  const otpRequired = ref(false);
  const requiresEmailVerification = ref(false);
  const inProgress = ref(false);
  const alerts = ref({
    error: '',
    success: '',
  });

  // ---- Methods ----
  async function login() {
    alerts.value.error = '';
    alerts.value.success = '';
    requiresEmailVerification.value = false;
    inProgress.value = true;

    try {
      await client.login(username.value, password.value, otp.value);

      password.value = '';
      otp.value = null;
      otpRequired.value = false;
      return 'success';
    } catch (err) {
      if (!err.response || err.response.status !== 401) {
        alerts.value.error = 'Unknown error.';
        throw err;
      }

      const { message, extra } = err.response.data;

      if (message?.includes(OTP_MAGIC_SUBSTRING)) {
        otp.value = null;
        otpRequired.value = true;
        return 'otp';
      }

      alerts.value.error = message || 'Unauthorized.';
      if (extra === 'emailVerification') {
        requiresEmailVerification.value = true;
      }
      return 'error';
    } finally {
      inProgress.value = false;
    }
  }

  async function logout() {
    await client.logout();
  }

  async function sendVerification() {
    await client.post('user/verification', null, {
      params: { login: username.value },
    });

    alerts.value.error = '';
    alerts.value.success = 'Verification email sent';
    requiresEmailVerification.value = false;
  }

  return {
    user,
    username,
    password,
    otp,
    otpRequired,
    requiresEmailVerification,
    inProgress,
    alerts,
    login,
    logout,
    sendVerification,
  };
}
