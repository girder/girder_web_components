import Vuetify from 'vuetify/lib';
import * as mixins from './mixins';
import vuetifyConfig from './vuetifyConfig';

const vuetify = new Vuetify(vuetifyConfig);

export { default as S3UploadManager } from './s3';
export { default as UploadManager } from './upload';
export { default as DebounceCounter } from './debouncer';
export { default as NotificationBus } from './notifications';
export * from './locationHelpers';
export { mixins, vuetify, vuetifyConfig };
