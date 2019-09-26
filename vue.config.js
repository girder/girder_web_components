const path = require('path');
const webpack = require('webpack'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  lintOnSave: false,
  publicPath: '/',
  chainWebpack: (config) => {
    config.resolve.set('symlinks', false);
  },
  configureWebpack: {
    plugins: [
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    resolve: {
      alias: {
        vue$: path.resolve(__dirname, './node_modules/vue/dist/vue.esm.js'),
      },
    },
  },
};
