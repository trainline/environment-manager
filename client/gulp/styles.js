/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var browserSync = require('browser-sync');
var $ = require('gulp-load-plugins')();

gulp.task('styles-reload', ['styles'], function () {
  return buildStyles()
    .pipe(browserSync.stream());
});

gulp.task('styles', function () {
  return buildStyles();
});

var buildStyles = function () {
  var sassOptions = {
    outputStyle: 'expanded',
    precision: 10
  };

  var injectOptions = {
    transform: function (filePath) {
      filePath = filePath.replace(conf.paths.src + '/app/', '');
      return '@import "' + filePath + '";';
    },
    starttag: '// injector',
    endtag: '// endinjector',
    addRootSlash: false
  };


  return gulp.src([
    path.join(conf.paths.src, '/styles/app.scss')
  ])
    .pipe($.sourcemaps.init())
    .pipe($.sass(sassOptions)).on('error', conf.errorHandler('Sass'))
    .pipe($.autoprefixer()).on('error', conf.errorHandler('Autoprefixer'))
    .pipe($.sourcemaps.write())
    .pipe($.rename('app-generated.css'))
    .pipe(gulp.dest('./styles/'));
    // .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve/app/')));
};
