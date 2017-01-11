/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var karma = require('karma');
var argv = require('yargs').argv;

var pathSrcHtml = [
  path.join(conf.paths.src, '/**/*.html')
];

function runTests(singleRun, done) {
  var reporter = argv.c ? 'teamcity' : 'progress';
  var reporters = [reporter];
  var preprocessors = {};

  pathSrcHtml.forEach(function (path) {
    preprocessors[path] = ['ng-html2js'];
  });

  var localConfig = {
    configFile: path.join(__dirname, '/../karma.conf.js'),
    singleRun: singleRun,
    autoWatch: !singleRun,
    reporters: reporters,
    preprocessors: preprocessors
  };

  var server = new karma.Server(localConfig);
  server.start();
}

gulp.task('test', [], function (done) {
  runTests(true, done);
});

gulp.task('test:auto', ['watch'], function (done) {
  runTests(false, done);
});
