import '@mdi/font/css/materialdesignicons.min.css';
import 'vuetify/dist/vuetify.min.css';
import AsyncComputed from 'vue-async-computed';

import Authentication from './Authentication/';
import FileBrowser from './FileBrowser/';
import Upload from './Upload.vue';

Vue.use(AsyncComputed);
Vue.use(Vuetify, {
  iconfont: 'mdi',
  icons: {
    bitbucket: 'mdi-bitbucket',
    box_com: 'mdi-package',
    chevron: 'mdi-chevron-right',
    collection: 'mdi-file-tree',
    file: 'mdi-file',
    fileUpload: 'mdi-file-upload',
    folder: 'mdi-folder',
    github: 'mdi-github-circle',
    globe: 'mdi-earth',
    google: 'mdi-google',
    group: 'mdi-account-multiple',
    item: 'mdi-file-document',
    user: 'mdi-account',
  },
});

export {
  Authentication,
  FileBrowser,
  Upload,
};
