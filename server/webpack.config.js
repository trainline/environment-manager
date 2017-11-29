'use strict';

const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  devtool: 'source-map',
  target: 'node',
  node: {
    __dirname: false
  },
  context: __dirname,
  entry: {
    main: './src/index.js'
  },
  output: {
    filename: './lib/bundle.js'
  },
  resolve: {
    extensions: ['.js', '.json', '.ts']
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  },
  externals: [nodeExternals()],
  plugins: [
    new webpack.BannerPlugin({ banner: 'require("source-map-support").install();', raw: true, entryOnly: false })
  ]
};
