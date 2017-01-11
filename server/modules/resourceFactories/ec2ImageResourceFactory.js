/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let awsAccounts = require('modules/awsAccounts');
let cacheManager = require('modules/cacheManager');
const imagesCache = cacheManager.create('ImagesCache', null, { stdTTL: 30 * 60 });
const USE_CACHE = true;

function ImageResource(client, account) {
  function getImagesOwners() {
    return awsAccounts.getAMIsharingAccounts()
      .then(accounts => _.uniq(accounts.concat(account.AccountNumber))
      .map(n => `${n}`));
  }

  function buildRequest(query) {
    let Filters = [];
    if (query) {
      // {a:1, b:2} => [{Name:'a', Values:[1]}, {Name:'b', Values:[2]}]
      Filters = _.toPairs(query).map(q => ({ Name: q[0], Values: _.concat(q[1]) }));
    }

    Filters.push({ Name: 'state', Values: ['available'] });
    Filters.push({ Name: 'is-public', Values: ['false'] });
    Filters.push({ Name: 'image-type', Values: ['machine'] });

    return getImagesOwners().then(Owners => ({ Filters, Owners }));
  }

  this.all = function (params) {
    return cachedGetAll(params);
  };

  function cachedGetAll(params) {
    if (params.filter || !USE_CACHE) {
      return getAll(params);
    }

    let accountName = account.AccountName.toLowerCase();
    return imagesCache.get(accountName).then((result) => {
      if (result) {
        return result;
      } else {
        return getAll(params).then((freshResult) => {
          if (freshResult) {
            imagesCache.set(accountName, freshResult);
          }
          return freshResult;
        });
      }
    });
  }

  function getAll(parameters) {
    return buildRequest(parameters.filter)
      .then(request => client.describeImages(request).promise()
      .then(data => data.Images));
  }
}

function* create(resourceDescriptor, parameters) {
  let account = yield awsAccounts.getByName(parameters.accountName);
  return amazonClientFactory.createEC2Client(parameters.accountName).then(
    client => new ImageResource(client, account));
}

function canCreate(resourceDescriptor) {
  return resourceDescriptor.type.toLowerCase() === 'ec2/image';
}


module.exports = {
  canCreate,
  create: co.wrap(create)
};
