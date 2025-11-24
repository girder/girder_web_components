/**
 * This is the Vuetify configuration Object needed to use Girder components. This is provided so
 * that downstreams who are using Vuetify can merge their own Vuetify config options prior to
 * installing the GirderVue plugin.
 */

import { mdi } from 'vuetify/iconsets/mdi';
import colors from 'vuetify/lib/util/colors';
import { GoogleIcon, MicrosoftIcon } from '@/icons/';

export default {
  theme : {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: colors.lightBlue.darken1,
          secondary: colors.blueGrey.base,
          accent: colors.lightBlue.darken1,
          error: colors.red.base,
          info: colors.lightBlue.lighten1,
          dropzone: colors.grey.lighten3,
          highlight: colors.yellow.lighten4,
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: colors.lightBlue.darken3,
          secondary: colors.grey.base,
          accent: colors.lightBlue.lighten1,
          dropzone: colors.grey.darken2,
          highlight: colors.grey.darken2,
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      alert: 'mdi-alert-circle',
      bitbucket: 'mdi-bitbucket',
      box_com: 'mdi-package',
      chevron: 'mdi-chevron-right',
      circle: 'mdi-checkbox-blank-circle',
      collection: 'mdi-file-tree',
      delete: 'mdi-minus-circle',
      download: 'mdi-download',
      edit: 'mdi-pencil',
      error: 'mdi-alert-circle',
      externalLink: 'mdi-open-in-new',
      file: 'mdi-file',
      fileMultiple: 'mdi-file-multiple',
      fileNew: 'mdi-file-plus',
      fileUpload: 'mdi-file-upload',
      folder: 'mdi-folder',
      folderMultiple: 'mdi-folder-multiple',
      folderNonPublic: 'mdi-folder-key',
      folderNew: 'mdi-folder-plus',
      github: 'mdi-github',
      globe: 'mdi-earth',
      google: GoogleIcon,
      item: 'mdi-file',
      linkedin: 'mdi-linkedin',
      lock: 'mdi-lock',
      login: 'mdi-login',
      logout: 'mdi-logout',
      microsoft: MicrosoftIcon,
      more: 'mdi-dots-horizontal',
      otp: 'mdi-shield-key',
      preview: 'mdi-file-find',
      search: 'mdi-magnify',
      settings: 'mdi-tune',
      user: 'mdi-account',
      userGroup: 'mdi-account-multiple',
      userHome: 'mdi-home-account',
      view: 'mdi-eye',
    },
    sets: { 
      mdi,
      custom: {
        component: GoogleIcon,
        component: MicrosoftIcon,
      },
    },
  },
};
