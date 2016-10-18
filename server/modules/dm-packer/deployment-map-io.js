/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let fs = require('mz/fs');
let path = require('path');

function getStaticContent(directory) {
  return co(function* () {
    let files = (yield fs.readdir(directory)).map(file => path.join(directory, file));
    let stats = yield files.map(file => fs.stat(file).then((stat) => {
      return { file, stat };
    }));
    return stats.filter(x => x.stat.isFile()).map((x) => {
      return { path: path.basename(x.file), content: fs.createReadStream(x.file) };
    });
  });
}

module.exports = {
  getStaticContent,
};
