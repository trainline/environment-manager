/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let fs = require('fs');
let gulp = require('gulp');
let path = require('path');
let rimraf = require('rimraf');
let run = require('gulp-run');
let zip = require('gulp-vinyl-zip');
let { gitDescribe, readPackageFile, updateVersion } = require('./version.js');

const BUILD_DIR = path.resolve('./build');
const OUT_DIR = path.resolve('./dist');

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

function yarnInstall(cwd) {
  return run('yarn install --production --frozen-lockfile', { cwd }).exec();
}

function copyServerFiles() {
  return gulp.src([
    '**/*',
    '!acceptance-tests/**/*',
    '!lib/test/**/*',
    '!node_modules/**/*',
    '!src/**/*',
    '!.*',
    '!configuration.sample.json'
  ], { cwd: './server', nodir: true })
    .pipe(gulp.dest(BUILD_DIR));
}

function client() {
  return run(`gulp build --gulpfile client/gulpfile.js -p -o ${BUILD_DIR}/dist`).exec();
}

function pack() {
  updateVersion(BUILD_DIR, getVersionFromGit);
  let version = getVersionFromGit();
  fs.writeFileSync(path.resolve(`${BUILD_DIR}/version.txt`), version, { encoding: 'utf-8' });
  return gulp.src(`${BUILD_DIR}/**/*`)
    .pipe(zip.dest(`dist/environment-manager-${version}.zip`));
}

function clean(done) {
  rimraf(`{${BUILD_DIR},${OUT_DIR}}`, done);
}

gulp.task('clean', clean);
gulp.task('copy-server-files', ['clean'], copyServerFiles);
gulp.task('server', ['copy-server-files'], () => yarnInstall(BUILD_DIR));
gulp.task('client', ['clean'], client);
gulp.task('pack', ['client', 'server'], pack);
gulp.task('default', ['pack']);