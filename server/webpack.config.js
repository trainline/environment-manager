'use strict';

const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

const server = {
  devtool: 'source-map',
  target: 'node',
  node: {
    __dirname: false
  },
  context: __dirname,
  entry: {
    server: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: '[name].js'
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

module.exports = server;
