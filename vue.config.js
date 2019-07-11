const webpack = require('webpack'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  lintOnSave: false,
  // publicPath only affects demo application deployed to GH pages.
  publicPath: process.env.NODE_ENV === 'production'
    ? '/girder_web_components'
    : '/',
  configureWebpack: {
    plugins: [
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
  },
};
