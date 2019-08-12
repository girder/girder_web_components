const webpack = require('webpack'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  lintOnSave: false,
  publicPath: '/',
  configureWebpack: {
    plugins: [
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
  },
};
