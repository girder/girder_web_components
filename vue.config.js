module.exports = {
  lintOnSave: false,
  // publicPath only affects demo application deployed to GH pages.
  publicPath: process.env.NODE_ENV === 'production'
    ? '/girder_web_components'
    : '/',
};
