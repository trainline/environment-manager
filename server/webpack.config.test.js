'use strict';

const baseConfig = require('./webpack.config');

const testConfig = Object.assign({}, baseConfig,
  {
    devtool: 'inline-cheap-module-source-map',
    plugins: []
  });

module.exports = testConfig;

