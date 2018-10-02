import Vue from 'vue';
import Vuetify from 'vuetify';
import '@mdi/font/css/materialdesignicons.min.css';
import 'vuetify/dist/vuetify.min.css';
import Authentication from './Authentication/';
import Upload from './Upload.vue';

Vue.use(Vuetify, {
  iconfont: 'mdi',
  icons: {
    bitbucket: 'mdi-bitbucket',
    box_com: 'mdi-package',
    collection: 'mdi-file-tree',
    file: 'mdi-file',
    fileUpload: 'mdi-file-upload',
    folder: 'mdi-folder',
    github: 'mdi-github-circle',
    globus: 'mdi-earth',
    google: 'mdi-google',
    group: 'mdi-account-multiple',
    item: 'mdi-file-document',
    linkedin: 'mdi-linkedin',
    lock: 'mdi-lock',
    login: 'mdi-login',
    user: 'mdi-account',
  },
});

export {
  Upload,
  Authentication,
};
