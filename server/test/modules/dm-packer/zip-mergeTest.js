/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let path = require('path');
let archiver = require('archiver');
let zipMerge = require('modules/dm-packer/zip-merge');
let _ = require('lodash');

require('should');

let nullLogger = {
  debug: _.noop,
  info: _.noop,
  warning: _.noop,
  error: _.noop,
};

describe('zip-merge', function() {

  describe('get zip entries', function() {

    function getEntries(inputStream, filter) {
      let entryStream = zipMerge.createEntryStream(inputStream, filter, nullLogger);
      return dump(entryStream);
    }

    context('without a filter', function () {
      let input = new Map([['a.txt', 'A'], ['a/b.txt', 'B']]);
      it('should return all the entries', function() {
        let inputStream = zip(input);
        return getEntries(inputStream).should.finally.eql(input);
      });
    });

    context('with a filter', function () {
      let input = new Map([['a.txt', 'A'], ['a/b.txt', 'B']]);
      it('should only return matching items', function() {
        let inputStream = zip(input);
        return getEntries(inputStream, x => x === 'a.txt').should.finally.eql(new Map([['a.txt', 'A']]));
      });
    });
  });

  describe('merge zip streams', function() {

    function merge(inputStreams) {
      let entryStreams = inputStreams.map(zipMerge.createEntryStream);
      let mergedStream = zipMerge.mergeS(entryStreams);
      return dump(mergedStream);
    }

    context('with one zipped stream', function () {
      let input = new Map([['/a.txt', 'A'], ['/a/b.txt', 'B']]);
      it('should be the same as the input', function() {
        let inputStreams = [zip(input)];
        merge(inputStreams).should.finally.eql(input);
      });
    });

    context('with conflict free zipped streams', function () {
      let inputs = [
        new Map([['/1/a.txt', 'A'], ['/1/a/b.txt', 'B']]),
        new Map([['/2/a.txt', 'A'], ['/2/a/b.txt', 'B']]),
        new Map([['/3/a.txt', 'A'], ['/3/a/b.txt', 'B']])
      ];
      let expected = new Map([
        ['/1/a.txt', 'A'],
        ['/1/a/b.txt', 'B'],
        ['/2/a.txt', 'A'],
        ['/2/a/b.txt', 'B'],
        ['/3/a.txt', 'A'],
        ['/3/a/b.txt', 'B']
      ]);
      it('should be the union of the inputs', function() {
        let inputStreams = inputs.map(zip);
        merge(inputStreams).should.finally.eql(expected);
      });
    });
  });
});

function zip(entries) {
  let archive = archiver.create('zip', {});
  for (let entry of entries) {
    archive.append(entry[1], {name: entry[0]});
  }
  archive.finalize();
  return archive;
}

function flushToString(readStream) {
  if (typeof readStream === 'string') return Promise.resolve(readStream);
  return new Promise(resolve => {
    let out = '';
    readStream.on('end', () => resolve(out));
    readStream.on('data', data => {
      out = out.concat(data);
    });
  });
}

function dump(entryStream) {
  return co(function *() {
    let entries = [];
    let finished = new Promise(resolve => entryStream.once('end', () => resolve()));
    entryStream.on('data', entry => {
      entries.push(flushToString(entry.content).then(content => [entry.path, content]));
    });
    // Fails around here.
    yield finished;
    return new Map(yield entries);
  });
}

