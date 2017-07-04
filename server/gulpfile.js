/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let gulp = require('gulp');
let argv = require('yargs').argv;
let path = require('path');
let run = require('gulp-run');

function output() {
  return argv.o || './build';
}

function copy() {
  return gulp.src([
    '*api/**/*',
    '*commands/**/*',
    '*config/**/*',
    '*deployment/**/*',
    '*healthchecks/**/*',
    '*models/**/*',
    '*modules/**/*',
    '!node_modules/**/*',
    '*queryHandlers/**/*',
    '*resources/**/*',
    '*routes/**/*',
    'appspec.yml',
    'Enums.js',
    'globals.js',
    'index.js',
    'package.json',
    'tempMapResolver.js',
    'yarn.lock'
  ]).pipe(gulp.dest(output()));
}

function yarn() {
  return run('yarn install --production', { cwd: path.resolve(output()) }).exec();
}

gulp.task('copy', copy);
gulp.task('yarn', ['copy'], yarn);
gulp.task('build', ['yarn']);
