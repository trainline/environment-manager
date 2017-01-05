/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let proxyquire = require('proxyquire');
let path = require('path');
let should = require('should');

describe('nuget http', function() {

  var sut;
  var requestResponseMap = {};

  var nugetMock = {
    getPackageMetadataPath: (id, version) =>  `${id}/${version}`,
    getDownloadLink: metadata => metadata.downloadUrl,
    getDependencies: metadata => metadata.dependsOn
  };

  var simpleHttpMock = {
    getContent: url => {
      return Promise.resolve(requestResponseMap[url]);
    }
  };

  before(function() {
    sut = proxyquire(path.resolve('modules/dm-packer/nuget-http'), {'./nuget': nugetMock, './simple-http': simpleHttpMock});
  });

  describe('get download plan', function() {
    context('when the package has no dependencies', function () {
      it('should be just that package', function() {
        requestResponseMap = {
          'foo/1.0.0': {
            id: 'foo',
            version: '1.0.0',
            downloadUrl: 'foo/1.0.0/download',
            dependsOn: []
          }
        };
        let expected = [{id: 'foo', version: '1.0.0', downloadUrl: 'foo/1.0.0/download'}];
        return sut.getDownloadPlan('', {id:'foo', version:'1.0.0'}).should.be.finally.eql(expected);
      });
    });
    context('when the package has some dependencies', function () {
      it('should be all those packages recursively', function() {
        requestResponseMap = {
          'A/1.0.0': {
            id: 'A',
            version: '1.0.0',
            downloadUrl: 'A/1.0.0/download',
            dependsOn: [{id: 'B', version: '2.0.0'}, {id: 'C', version: '3.0.0'}]
          },
          'B/2.0.0': {
            id: 'B',
            version: '2.0.0',
            downloadUrl: 'B/2.0.0/download',
            dependsOn: []
          },
          'C/3.0.0': {
            id: 'C',
            version: '3.0.0',
            downloadUrl: 'C/3.0.0/download',
            dependsOn: [{id: 'D', version: '4.0.0'}]
          },
          'D/4.0.0': {
            id: 'D',
            version: '4.0.0',
            downloadUrl: 'D/4.0.0/download',
            dependsOn: []
          }
        };
        let expected = [
          {id: 'A', version: '1.0.0', downloadUrl: 'A/1.0.0/download'},
          {id: 'B', version: '2.0.0', downloadUrl: 'B/2.0.0/download'},
          {id: 'C', version: '3.0.0', downloadUrl: 'C/3.0.0/download'},
          {id: 'D', version: '4.0.0', downloadUrl: 'D/4.0.0/download'}
        ];
        return sut.getDownloadPlan('', {id:'A', version:'1.0.0'}).should.be.finally.eql(expected);
      });
    });
    context('when the package has some circular dependencies', function () {
      it('should terminate', function() {
        requestResponseMap = {
          'A/1.0.0': {
            id: 'A',
            version: '1.0.0',
            downloadUrl: 'A/1.0.0/download',
            dependsOn: [{id: 'B', version: '2.0.0'}]
          },
          'B/2.0.0': {
            id: 'B',
            version: '2.0.0',
            downloadUrl: 'B/2.0.0/download',
            dependsOn: [{id: 'A', version: '1.0.0'}]
          }
        };
        let expected = [
          {id: 'A', version: '1.0.0', downloadUrl: 'A/1.0.0/download'},
          {id: 'B', version: '2.0.0', downloadUrl: 'B/2.0.0/download'}
        ];
        let delay = time => new Promise(resolve => setTimeout(resolve, time));
        let result = sut.getDownloadPlan('', {id:'A', version:'1.0.0'}).should.be.finally.eql(expected);
        return Promise.race([delay(200).then(() => {throw new Error('Timeout');}), result]);
      });
    });
  });
});
