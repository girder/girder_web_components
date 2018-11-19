/**
 * This is the Vuetify configuration Object needed to use Girder components. This is provided so
 * that downstreams who are using Vuetify can merge their own Vuetify config options prior to
 * installing the GirderVue plugin.
 */

import colors from 'vuetify/es5/util/colors';

export default {
  theme: {
    primary: colors.lightBlue.darken1,
    secondary: colors.blueGrey,
    accent: colors.lightBlue.darken1,
    error: colors.red,
  },
  iconfont: 'mdi',
  icons: {
    bitbucket: 'mdi-bitbucket',
    box_com: 'mdi-package',
    chevron: 'mdi-chevron-right',
    collection: 'mdi-file-tree',
    edit: 'mdi-pencil',
    file: 'mdi-file',
    fileNew: 'mdi-file-plus',
    fileUpload: 'mdi-file-upload',
    folder: 'mdi-folder',
    folderNew: 'mdi-folder-plus',
    github: 'mdi-github-circle',
    globe: 'mdi-earth',
    globus: 'mdi-earth',
    google: 'mdi-google',
    group: 'mdi-account-multiple',
    item: 'mdi-file',
    linkedin: 'mdi-linkedin',
    lock: 'mdi-lock',
    login: 'mdi-login',
    preview: 'mdi-file-find',
    user: 'mdi-account',
  },
};
