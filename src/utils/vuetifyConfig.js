/**
 * This is the Vuetify configuration Object needed to use Girder components. This is provided so
 * that downstreams who are using Vuetify can merge their own Vuetify config options prior to
 * installing the GirderVue plugin.
 */

import colors from 'vuetify/lib/util/colors';

export default {
  theme: {
    dark: false,
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: colors.lightBlue.darken1,
        secondary: colors.blueGrey,
        accent: colors.lightBlue.darken1,
        error: colors.red,
        info: colors.lightBlue.lighten1,
        dropzone: colors.grey.lighten3,
      },
      dark: {
        primary: colors.lightBlue.darken3,
        secondary: colors.grey,
        accent: colors.lightBlue.lighten1,
        dropzone: colors.grey.darken2,
      },
    },
  },
  icons: {
    iconfont: 'mdi',
    values: {
      alert: 'mdi-alert-circle',
      bitbucket: 'mdi-bitbucket',
      box_com: 'mdi-package',
      chevron: 'mdi-chevron-right',
      circle: 'mdi-checkbox-blank-circle',
      collection: 'mdi-file-tree',
      download: 'mdi-download',
      edit: 'mdi-pencil',
      file: 'mdi-file',
      fileMultiple: 'mdi-file-multiple',
      fileNew: 'mdi-file-plus',
      fileUpload: 'mdi-file-upload',
      folder: 'mdi-folder',
      folderNonPublic: 'mdi-folder-key',
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
      logout: 'mdi-logout',
      more: 'mdi-dots-horizontal',
      otp: 'mdi-shield-key',
      preview: 'mdi-file-find',
      search: 'mdi-magnify',
      settings: 'mdi-tune',
      user: 'mdi-account',
      userHome: 'mdi-home-account',
      view: 'mdi-eye',
    },
  },
};
