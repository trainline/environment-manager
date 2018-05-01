/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('partials', function () {
  return gulp.src([
    path.join(conf.paths.src, '/app/**/*.html'),
    path.join(conf.paths.tmp, '/serve/app/**/*.html')
  ])
    .pipe($.htmlmin({
      removeEmptyAttributes: true,
      removeAttributeQuotes: true,
      collapseBooleanAttributes: true,
      collapseWhitespace: true
    }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: conf.templatesModule,
      root: 'app'
    }))
    .pipe(gulp.dest(conf.paths.tmp + '/partials/'));
});

gulp.task('html', ['inject', 'partials'], function () {
  var partialsInjectFile = gulp.src(path.join(conf.paths.tmp, '/partials/templateCacheHtml.js'), { read: false });
  var partialsInjectOptions = {
    starttag: '<!-- inject:partials -->',
    ignorePath: path.join(conf.paths.tmp, '/partials'),
    addRootSlash: false
  };

  var injectedHtmlFileName = conf.getInjectedHTMLfileName();

  var jsFilter = $.filter('**/*.js', { restore: true });
  var cssFilter = $.filter('**/*.css', { restore: true });
  var tmpHtmlFilter = $.filter('**/' + injectedHtmlFileName, { restore: true });
  var output = conf.getTargetDirectory();
  var srcHtml = path.join('./', injectedHtmlFileName);
  var createSourceMaps = !conf.isProductionBuild();

  return gulp.src(srcHtml)
    .pipe($.inject(partialsInjectFile, partialsInjectOptions))
    .pipe($.useref())
    .pipe(jsFilter)
    .pipe(gulpif(createSourceMaps, $.sourcemaps.init()))
    .pipe($.ngAnnotate())
    .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
    .pipe($.rev())
    .pipe(gulpif(createSourceMaps, $.sourcemaps.write('maps')))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe($.replace('../../bower_components/bootstrap-sass/assets/fonts/bootstrap/', '../fonts/'))
    .pipe($.cssnano())
    .pipe($.rev())
    .pipe(cssFilter.restore)
    .pipe($.revReplace())
    .pipe(tmpHtmlFilter)
    .pipe(rename('./index.html'))
    .pipe(tmpHtmlFilter.restore)
    .pipe(gulp.dest(output))
    .pipe($.size({ title: path.join(conf.paths.dist, '/'), showFiles: true }));
});

gulp.task('other', function () {
  var fileFilter = $.filter(function (file) {
    return file.stat.isFile();
  });
  var output = conf.getTargetDirectory();

  return gulp.src([
    './assets/images/**/*',
    './assets/css/**/*',
    './docs/**/*',
    './schema/**/*',
    './styles/**/*.css',
    './app/**/*.html'
  ], { base: '.' })
  .pipe(fileFilter)
  .pipe(gulp.dest(output));
});

gulp.task('clean', function () {
  return $.del([path.join(conf.paths.dist, '/'), path.join(conf.paths.tmp, '/')]);
});

gulp.task('build', ['html', 'other']);

