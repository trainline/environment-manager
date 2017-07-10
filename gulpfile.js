/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let fs = require('fs');
let gulp = require('gulp');
let path = require('path');
let run = require('gulp-run');
let zip = require('gulp-vinyl-zip');
let { gitDescribe, readPackageFile, updateVersion } = require('./version.js');

function memoize(fn) {
  let memo = new Map();
  return (...args) => {
    let key = JSON.stringify(args);
    if (memo.has(key)) {
      return memo.get(key);
    } else {
      let value = fn(...args);
      memo.set(key, value);
      return value;
    }
  }
}

let describeVersion = memoize(gitDescribe);

function getVersionFromGit(version) {
  let description = describeVersion();
  return description
    .replace(/^v/i, '')
    .replace(/-(g\w+)$/i, '+$1');
}

function server() {
  updateVersion('server', getVersionFromGit);
  return run('gulp build --gulpfile server/gulpfile.js -p -o ../build').exec();
}

function client() {
  updateVersion('client', getVersionFromGit);
  return run('gulp build --gulpfile client/gulpfile.js -p -o ../build/dist').exec();
}

function pack() {
  let version = getVersionFromGit();
  fs.writeFileSync(path.resolve('build/version.txt'), version, { encoding: 'utf-8' });
  return gulp.src('build/**/*')
    .pipe(zip.dest(`dist/environment-manager-${version}.zip`));
}

gulp.task('pack', ['client', 'server'], pack);
gulp.task('client', client);
gulp.task('server', server);
gulp.task('default', ['pack']);