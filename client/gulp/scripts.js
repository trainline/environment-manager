/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var path = require('path');
var gulp = require('gulp');

var browserSync = require('browser-sync');

var $ = require('gulp-load-plugins')();


gulp.task('scripts-reload', function() {
  return buildScripts()
    .pipe(browserSync.stream());
});

gulp.task('scripts', function() {
  return buildScripts();
});

function buildScripts() {
  return gulp.src('app/**/*.js')
  	// TODO(filip): fix linting
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.size())
};
