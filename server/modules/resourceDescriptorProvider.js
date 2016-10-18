/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let requireDirectory = require('require-directory');
let _ = require('lodash');

function ResourceDescriptorRepository(descriptors) {
  let $this = this;
  let $descriptors = descriptors;
  let $mappings = {};

  function loadMappings() {
    $descriptors.forEach((descriptor) => {
      $mappings[descriptor.name.toLowerCase()] = descriptor;
    });
  }

  $this.all = () => {
    return $descriptors;
  };

  $this.get = (name) => {
    return $mappings[name.toLowerCase()];
  };

  loadMappings();
}

let modules = [
  '../resources',
  '../resources/config',
  '../resources/deployments',
  '../resources/ops',
].map((directoryPath) => {
  return _.values(requireDirectory(module, directoryPath, { include: /Resource\.js/, recurse: false }));
});

let resources = _.flatten(modules);

module.exports = new ResourceDescriptorRepository(resources);
