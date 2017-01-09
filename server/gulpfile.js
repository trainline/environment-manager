/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let gulp = require('gulp');
let argv = require('yargs').argv;

function build() {
  let output = argv.o || './build';

  return gulp.src([
    '*api/**/*',
    '*commands/**/*',
    '*config/**/*',
    '*deployment/**/*',
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
    'npm-shrinkwrap.json',
    'package.json',
    'tempMapResolver.js',
  ]).pipe(gulp.dest(output));
}

gulp.task('build', build);
