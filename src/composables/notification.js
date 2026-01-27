import { reactive } from 'vue'
import NotificationBus from '@/utils/notificationBus'


export default function useNotificationBus(restClient, options = {}) {
  const state = reactive({
    lastNotification: null,
    errors: [],
    connected: false,
  });

  const bus = new NotificationBus(restClient, options);

  // ---- Wire events from bus → reactive mirror ----
  bus.on('start', () => {
    state.connected = true;
  });

  bus.on('stop', () => {
    state.connected = false;
  });

  bus.on('message', (note) => {
    state.lastNotification = note;
  });

  bus.on('error', (err) => {
    state.errors.push(err);
  });

  return { bus, state };
}