import Vue from 'vue';
import Vuetify from 'vuetify';
import '@mdi/font/css/materialdesignicons.min.css';
import 'vuetify/dist/vuetify.min.css';
import Upload from './Upload.vue';

Vue.use(Vuetify, {
  iconfont: 'mdi',
  icons: {
    collection: 'mdi-file-tree',
    file: 'mdi-file',
    fileUpload: 'mdi-file-upload',
    folder: 'mdi-folder',
    group: 'mdi-account-multiple',
    item: 'mdi-file-document',
    user: 'mdi-account',
  },
});

export { Upload };
