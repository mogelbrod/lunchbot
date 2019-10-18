const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  target: 'webworker',

  plugins: [
    // new BundleAnalyzerPlugin()
  ],

  optimization: {
    minimize: false,
  },
}
