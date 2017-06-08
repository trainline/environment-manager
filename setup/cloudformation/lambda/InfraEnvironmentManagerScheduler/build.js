'use strict';

let archiver = require('archiver-promise');
let fs = require('fs-extra');
let co = require('co');

let config = require('./package.json');

co(function* () {
  let { name, version } = config;
  let outDir = 'out';
  let destination = `${outDir}/${name}-${version}.zip`;

  yield fs.remove(outDir).then(() => fs.mkdir(outDir));
  yield zipFiles(__dirname, config.files, destination);

  console.log(destination);
});

function zipFiles(path, files, destination) {
  let archive = archiver(destination);
  archive.pipe(fs.createWriteStream(destination));
  files.forEach(file => archive.glob(file, { cwd: path }));
  return archive.finalize();
}