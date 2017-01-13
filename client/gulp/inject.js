/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

var gulp = require('gulp');
var conf = require('./conf');
var browserSync = require('browser-sync');
var $ = require('gulp-load-plugins')();
var rename = require('gulp-rename');

var appStream = gulp.src(conf.paths.appScripts);

gulp.task('inject-reload', ['inject'], function () {
  browserSync.reload();
});

gulp.task('inject', [], function () {
  var injectScripts = appStream
    .pipe($.angularFilesort()).on('error', conf.errorHandler('AngularFilesort'));

  var injectOptions = {
    ignorePath: ['.'],
    addRootSlash: false,
    relative: true
  };

  return gulp.src(conf.paths.indexHtml)
    .pipe($.inject(injectScripts, injectOptions))
    .pipe(rename(conf.getInjectedHTMLfileName()))
    .pipe(gulp.dest('.'));
});
