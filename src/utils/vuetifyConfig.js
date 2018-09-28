/**
 * This is the Vuetify configuration Object needed to use Girder components. This is provided so
 * that downstreams who are using Vuetify can merge their own Vuetify config options prior to
 * installing the GirderVue plugin.
 */
export default {
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
};
