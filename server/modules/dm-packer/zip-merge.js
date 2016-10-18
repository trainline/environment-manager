/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let through = require('through2');
let unzip = require('unzip2');

/*
inputs is an iterable of objects of the following form
{
  mapPath: string -> string (map source entry path to destination entry path)
  filterPath: string -> bool (filter entries by path)
  contentStream: stream.Readable (zipped stream)
}
*/

function createEntryStream(input, filter, logger) {
  let safeFilter = (filter instanceof Function) ? filter : () => true;

  let output = through.obj();
  input.pipe(unzip.Parse())
  .on('entry', (entry) => {
    if (safeFilter(entry.path)) {
      output.push({ path: entry.path, content: entry });
    } else {
      entry.autodrain();
    }
  })
  .on('error', (error) => {
    logger.error(`An error has occurred creating the zip package: ${error.message}`);
  })
  .once('close', () => {
    logger.debug('zip stream closed');
    setTimeout(() => output.end(), 1000);
  });
  return output;
}

function mapS(fn) {
  let results = through.obj((chunk, enc, callback) => {
    callback(null, fn(chunk));
  });
  return results;
}

function mergeS(inputs) {
  let output = through.obj();
  let sources = new Set(inputs);
  for (let input of inputs) {
    input.once('end', () => {
      sources.delete(input);
      if (sources.size < 1) {
        output.end();
      }
    });
    input.pipe(output, { end: false });
  }
  return output;
}

function appendS(items) {
  return through({ objectMode: true },
    (chunk, enc, callback) => {
      callback(null, chunk);
    },
    function (callback) {
      for (let item of items) {
        this.push(item);
      }
      callback();
    });
}

module.exports = {
  appendS,
  createEntryStream,
  mapS,
  mergeS,
};
