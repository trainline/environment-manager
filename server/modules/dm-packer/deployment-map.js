/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var co = require('co');
var moment = require('moment');
var uuid = require('node-uuid');
var path = require('path');
var io = require('./deployment-map-io');
var through = require('through2');
var z = require('./zip-merge');

const HEALTHCHECK_DIR_REGEX = /^healthchecks[\\/]/;

function getCodeDeployEntries(deploymentMap, inputPackages, options, logger) {
  let isMain = pack => pack.id === deploymentMap.id && pack.version === deploymentMap.version;
  let isHealthcheck = entry => HEALTHCHECK_DIR_REGEX.test(entry);
  let entryStreams = (function *() {
    yield getCodeDeploySpecialEntries(deploymentMap, options);
    for (let pack of inputPackages) {
      let mapPath = isMain(pack) ? (entry => isHealthcheck(entry) ? path.normalize(entry) : path.join('DM', entry)) : entry => path.join(pack.id, entry);
      let result = z.createEntryStream(pack.contentStream, filterOutNugetJunk, logger).pipe(z.mapS(entry => {
        let transformedPath = mapPath(entry.path);
        entry.path = transformedPath;
        return entry;
      }));
      yield result;
    }
  })();

  let entryStream = z.mergeS(Array.from(entryStreams));
  return Promise.resolve(entryStream);
}

function getCodeDeploySpecialEntries(deploymentMap, options) {
  let uuidForDirectoryDiscovery = uuid.v1();

  let output = through({objectMode: true});

  output.push({path: 'appspec.yml', content: getAppSpec()});
  output.push({path: 'ScriptArguments.ps1', content: getScriptArguments({
    deploymentMap: deploymentMap
  })});

  co (function *() {
    let staticContent = yield io.getStaticContent(path.resolve(__dirname, 'code-deploy-files'));
    for (let entry of staticContent) {
      output.push(entry);
    }
    output.end();
  });

  return output;
}

function filterOutNugetJunk(file) {
  let parts = path.normalize(file).split(path.sep);
  return parts[0] !== '_rels'
    && parts[0] !== '[Content_Types].xml'
    && parts[0] !== 'package'
    && !(parts.length === 1 && path.extname(file) === '.nuspec');
}

function getCodeDeployFileName(deploymentMap) {
  let timestamp = moment.utc().format('YYYY-MM-DD-HH-mm-ss');
  return `${deploymentMap.id}-${deploymentMap.version}-${timestamp}.zip`;
}

function getScriptArguments(bindings) {
  return `# DM DETAILS

$DeploymentMapName="${bindings.deploymentMap.id}"
$DeploymentMapVersion="${bindings.deploymentMap.version}"`;
}

function getAppSpec() {
  return `version: 0.0
os: windows
hooks:
  ApplicationStop:
    - location: ApplicationStop.ps1
      timeout: 90
  BeforeInstall:
    - location: BeforeInstall.ps1
      timeout: 600
  AfterInstall:
    - location: AfterInstall.ps1
      timeout: 1200
  ApplicationStart:
    - location: ApplicationStart.ps1
      timeout: 180
  ValidateService:
    - location: ValidateService.ps1
      timeout: 600`;
}

module.exports = {
  getCodeDeployEntries: getCodeDeployEntries,
  getCodeDeployFileName: getCodeDeployFileName
};
