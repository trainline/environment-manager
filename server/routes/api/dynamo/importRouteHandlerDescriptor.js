/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let make = require('modules/utilities').make;
let config = require('config');
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');

function asRouteHandlerDescriptor(resource, action, commandName) {
  let url = make([
    resource.perAccount ? ':account' : null,
    resource.name,
    action,
  ]).uri();

  let docs;
  if (resource.docs) {
    docs = _.clone(resource.docs);
    docs.verb = action;
    docs.perAccount = resource.perAccount;
  }
  const masterAccountName = config.getUserValue('masterAccountName');
  
  return route
    .put(url)
    .named(resource.name)
    .withDocs(docs)
    .whenRequest((url, value) => {
      return _.isNil(value) ? new Error.InvalidOperation('Expected one or more items to import.') : null;
    })
    .do((request, response) => {
      let command = {
        name: commandName,
        resource: resource.name,
        items: _.concat(request.body),
        accountName: resource.perAccount ? request.params.account : masterAccountName,
      };

      send.command(command, request, response);
    });
}

let replaceHandler;
let mergeHandler;

resourceDescriptorProvider
  .all()
  .filter(resource => resource.type === 'dynamodb/table')
  .filter(resource => !!resource.importable)
  .map((resource) => {
    replaceHandler = asRouteHandlerDescriptor(resource, 'replace', 'ReplaceDynamoResources');
    mergeHandler = asRouteHandlerDescriptor(resource, 'merge', 'MergeDynamoResources');
  });

module.exports = [replaceHandler, mergeHandler];
