/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let fs = require('mz/fs');
let path = require('path');
let should = require('should');

describe('nuget', function() {

  var sut;

  before(function() {
    sut = require('modules/dm-packer/nuget');
  });

  describe('package metadata path', function() {
    context('when the package name and version are supplied', function () {
      it('should be', function() {
        sut.getPackageMetadataPath('foo', '1.0.0').should.be.equal(`Packages(Id='foo',Version='1.0.0')`);
      });
    });
  });

  describe('get download link from metadata document', function() {
    context('when the document contains a download link', function() {
      it('should be selected', function() {
        const expectedLink = 'http://view.artifacts.ttldev/artifactory/api/nuget/ttlpackages-internal-master/Download/Trainline.AgentAdmin.tlpk/1.0.2';
        return readFileAsync('package-metadata-example.xml').then(data => sut.getDownloadLink(data)).should.be.finally.equal(expectedLink);
      });
    });
    context('when the document contains no download link', function() {
      it('should throw an error', function() {
        (() => sut.getDownloadLink('')).should.throw('Could not find the download link in the NuGet package metadata document.');
      });
    });
  });

  describe('parse package specs', function() {
    context('when it is an empty string', function() {
      it('should be parsed correctly', function(){
        sut.parsePackageSpecs('').should.be.eql([]);
      });
    });
    context('when it is a single well-formed package spec', function() {
      it('should be parsed correctly', function(){
        sut.parsePackageSpecs('some.package:0.0.1').should.be.eql([{id: 'some.package', version: '0.0.1'}]);
      });
    });
    context('when it is two well-formed package specs', function() {
      it('should be parsed correctly', function(){
        sut.parsePackageSpecs('some.package:0.0.1|another.package:0.2.0').should.be.eql([{id: 'some.package', version: '0.0.1'}, {id: 'another.package', version: '0.2.0'}]);
      });
    });
  });

  describe('get dependencies from package metadata', function() {
    context('when it has some dependencies', function() {
      it('should be parsed correctly', function() {
        const expectedDependencies = [{id: 'TTL.AccountLinkingService.tlpk', version: '1.0.0-alpha056'}, {id: 'Trainline.AppInstaller', version: '8.6.111'}];
        return readFileAsync('package-metadata-example.xml').then(data => sut.getDependencies(data)).should.be.finally.eql(expectedDependencies);
      });
    });
    context('when it has no dependencies', function() {
      it('should return an empty array', function() {
        return readFileAsync('package-metadata-no-dependencies.xml').then(data => sut.getDependencies(data)).should.be.finally.eql([]);
      });
    });
  });
});

function readFileAsync (relativePath) {
  return fs.readFile(path.join(__dirname, 'test-data', relativePath), 'utf8');
}

