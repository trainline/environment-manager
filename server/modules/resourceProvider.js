/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let requireDirectory = require('require-directory');
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');
let _ = require('lodash');

let modulesTree = requireDirectory(module, {include: /ResourceFactory\.js/});
let resourceFactories = _.values(modulesTree.resourceFactories);

function getInstanceByDescriptor(resourceDescriptor, parameters) {
  var resourceFactory = _.find(resourceFactories, (factory) => factory.canCreate(resourceDescriptor));

  if (resourceFactory !== undefined) {
    return resourceFactory.create(resourceDescriptor, parameters);
  }

  return Promise.reject(new Error(
    `No factory found for "${resourceDescriptor.type}" resource type`
  ));
}

function getInstanceByName(resourceName, parameters) {
  var resourceDescriptor = resourceDescriptorProvider.get(resourceName);
  if (resourceDescriptor !== null && resourceDescriptor !== undefined) return getInstanceByDescriptor(resourceDescriptor, parameters);
  else return Promise.reject(new Error(`No resource found with name "${resourceName}".`));
}

module.exports = {
  getInstanceByName,
};
