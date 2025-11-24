import { useGirderClient, useNotificationBus } from '@/composables';
import components from './components';
import vuetify from './vuetify';

/**
 * @typedef {Object} GwcPluginOptions
 * @property {Object} [girder] - Configuration for the Girder Rest Client
 * @property {Object} [notifications] - Configuration for the Girder Notification Bus
 * @property {Boolean} [components] - Register all components
 * @property {Object} [vuetifyConfig] - Custom vuetify config
 */


/**
 * @param {import('vue').App} app
 * @param {GwcPluginOptions} [options={}]
 */
export default function install(app, options = {}) {
  const girder = useGirderClient(options.girder || {});

  if (!!girder.apiRoot.value) {
    girder.rest.fetchUser();
  }

  if (options.notifications){
    const notification = useNotificationBus(girder.rest, options.notifications);
    if (girder.user.value) {
      notification.bus.connect();
    }
    app.provide('notifications', notification);
  }
  
  app.provide('girder', girder);

  app.use(vuetify, options.vuetifyConfig || {});

  if (options.components){
    app.use(components);
  }
}
