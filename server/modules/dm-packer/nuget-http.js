/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let simpleHttp = require('./simple-http');
let nuget = require('./nuget');

function getDownloadPlan(rootUrl, packageSpec) {
  const loop = (root, spec, acc) => {
    let key = JSON.stringify(spec);
    if (acc.has(key)) return acc;
    const packageMetadataUrl = root + nuget.getPackageMetadataPath(spec.id, spec.version);
    return co(function *() {
      let metadata = yield simpleHttp.getContent(packageMetadataUrl);
      let dependencies = nuget.getDependencies(metadata);
      let downloadUrl = nuget.getDownloadLink(metadata);
      acc.set(key, {id: spec.id, version: spec.version, downloadUrl: downloadUrl});
      yield dependencies.map(x => loop(root, x, acc));
      return acc;
    });
  };

  return loop(rootUrl, packageSpec, new Map()).then(result => Array.from(result.values()));
}

module.exports = { getDownloadPlan };
