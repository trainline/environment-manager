'use strict';

const WebpackShellPlugin = require('webpack-shell-plugin');
const baseConfig = require('./webpack.config');

const config = {
  plugins: [
    ...baseConfig.plugins,
    new WebpackShellPlugin(new WebpackShellPlugin({
      onBuildEnd: [`nodemon ${__dirname}/lib/server.js`]
    }))
  ]
};

module.exports = Object.assign({}, baseConfig, config);
