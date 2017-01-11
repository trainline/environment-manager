/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let proxyquire = require('proxyquire').noCallThru();
let path = require('path');

describe('deployment-map-io', function() {
  let io;

  let files = {
    'some-file': {},
    'another-file': {},
    'some-directory': {}
  };

  let fs = {
    readdir: () => Promise.resolve(Object.keys(files)),
    stat: file => Promise.resolve({isFile: () => file.endsWith('file')}),
    createReadStream: file => file.replace('\\', '/')
  };

  before(function() {
    io = proxyquire(path.resolve('modules/dm-packer/deployment-map-io'), {'mz/fs': fs});
  });

  describe('get static content', function() {
    it('should return all the files', function() {
      return io.getStaticContent('my-dir').should.finally.eql([
        {path: 'some-file', content: 'my-dir/some-file'},
        {path: 'another-file', content: 'my-dir/another-file'}
      ]);
    });
  });
});
