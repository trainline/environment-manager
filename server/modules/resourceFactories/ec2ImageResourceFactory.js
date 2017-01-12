/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let awsAccounts = require('modules/awsAccounts');
let cacheManager = require('modules/cacheManager');
let fp = require('lodash/fp');

const USE_CACHE = true;

function getImagesVisibleToAccount(accountId, filter) {
  function getImagesOwners() {
    return awsAccounts.getAMIsharingAccounts()
      .then(accounts => _.uniq(accounts.concat(accountId))
        .map(_.toString));
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

  let ec2ClientPromise = amazonClientFactory.createEC2Client(accountId);

  return Promise.all([ec2ClientPromise, buildRequest(filter)])
    .then(([client, request]) => client.describeImages(request).promise())
    .then(data => data.Images);
}

const imagesCache = cacheManager.create('ImagesCache', getImagesVisibleToAccount, { stdTTL: 30 * 60 });

function ImageResource(account) {
  let accountId = _.toString(account.AccountNumber);

  function cachedGetAll(params) {
    let hasFilter = fp.flow(fp.get('filter'), fp.toPairs, x => x.length > 0);

    if (hasFilter(params) || !USE_CACHE) {
      return getImagesVisibleToAccount(accountId, params.filter);
    } else {
      return imagesCache.get(accountId);
    }
  }

  this.all = cachedGetAll;
}

function create(resourceDescriptor, parameters) {
  return awsAccounts.getByName(parameters.accountName)
  .then(account => new ImageResource(account));
}

function canCreate(resourceDescriptor) {
  return resourceDescriptor.type.toLowerCase() === 'ec2/image';
}

module.exports = {
  canCreate,
  create
};
