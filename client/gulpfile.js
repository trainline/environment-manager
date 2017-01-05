/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let fs = require('fs');
let gulp = require('gulp');
let zip = require('gulp-zip');

/**
 *  This will load all js files in the gulp directory
 *  in order to load all gulp tasks
 */
fs.readdirSync('./gulp').filter(function(file) {
  return (/\.js$/i).test(file);
}).map(function(file) {
  require('./gulp/' + file);
});


/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['clean'], function () {
  gulp.start('serve');
});
