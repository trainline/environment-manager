/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let archiver = require('archiver');
let co = require('co');
let path = require('path');
let proxyquire = require('proxyquire');
let should = require('should');
let stream = require('stream');
let _ = require('lodash');

let nullLogger = {
  debug: _.noop,
  info: _.noop,
  warning: _.noop,
  error: _.noop,
};

// This didn't work before we broke the app
describe('deployment-map', function() {

  var dm = {};

  before(function() {
    let deploymentMapIo = {
      getStaticContent: () => {
        let files = ['AfterInstall.ps1', 'ApplicationStart.ps1', 'ApplicationStop.ps1', 'BeforeInstall.ps1', 'Include.ps1', 'ValidateService.ps1'];
        let results = files.map(file => {
          let dummyStream = new stream.Stream.Readable();
          dummyStream.push(null);
          return {path: file, content: dummyStream};
        });
        return Promise.resolve(results);
      }
    };

    dm = proxyquire(path.resolve('modules/dm-packer/deployment-map'), {'./deployment-map-io': deploymentMapIo});
  });

  describe('Get CodeDeploy entries', function() {
    context('for a deployment map and its dependencies', function () {
      let inputs = () => [
        {id: 'DeploymentMap', version: '1.0.0', contentStream: zip({'1.txt': 'one', 'a/2.txt': 'two'})},
        {id: 'Dependency1', version: '2.0.0', contentStream: zip({'3.txt': 'three', 'b/4.txt': 'four'})}
      ];
      let deploymentMap = {id: 'DeploymentMap', version: '1.0.0'};
      let pathsShouldContain = (expected, entries) => entries.should.finally.have.properties(expected.map(path.normalize));
      it('should put each deployment map file in the "DM" directory', function() {
        let entries = dm.getCodeDeployEntries(deploymentMap, inputs(), {}, nullLogger).then(dump);
        return pathsShouldContain(['DM/1.txt', 'DM/a/2.txt'], entries);
      });
      it('should put each dependency file in a directory named for the dependency', function() {
        let entries = dm.getCodeDeployEntries(deploymentMap, inputs(), {}, nullLogger).then(dump);
        return pathsShouldContain(['Dependency1/3.txt', 'Dependency1/b/4.txt'], entries);
      });
      it('should put the static CodeDeploy files in the root directory', function() {
        let entries = dm.getCodeDeployEntries(deploymentMap, inputs(), {}, nullLogger).then(dump);
        return pathsShouldContain(
          ['AfterInstall.ps1', 'ApplicationStart.ps1', 'ApplicationStop.ps1', 'BeforeInstall.ps1', 'Include.ps1', 'ValidateService.ps1'], entries
        );
      });
      it('should put the generated CodeDeploy files in the root directory', function() {
        let entries = dm.getCodeDeployEntries(deploymentMap, inputs(), {}, nullLogger).then(dump);
        return pathsShouldContain(['appspec.yml', 'ScriptArguments.ps1'], entries);
      });
    });
  });
});

function zip(entries) {
  let archive = archiver.create('zip', {});
  for (let entry in entries) {
    archive.append(entries[entry], {name: entry});
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
    let entryPromises = [];
    let finished = new Promise(resolve => entryStream.on('finish', () => resolve()));
    entryStream.on('data', entry => {
      entryPromises.push(flushToString(entry.content).then(content => [entry.path, content]));
    });
    yield finished;
    let entries = yield entryPromises;
    let result = {};
    for (let entry of entries) {
      result[entry[0]] = entry[1];
    }
    return result;
    //return new Map(yield entries);
  });
}
