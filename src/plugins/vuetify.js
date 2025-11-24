import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { merge } from 'lodash';
import girderVuetifyConfig from './vuetifyConfig';

import { createVuetify } from 'vuetify';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default function install(app, customConfig = {}) {
  const appVuetifyConfig = merge(girderVuetifyConfig, customConfig);
  const vuetify = createVuetify(appVuetifyConfig);
  app.use(vuetify);
}
