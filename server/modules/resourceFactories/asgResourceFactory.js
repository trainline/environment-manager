/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let AsgResource = require('modules/resourceFactories/AsgResource');
let cacheManager = require('modules/cacheManager');
let logger = require('modules/logger');
let _ = require('lodash');

let AutoScalingGroupNotFoundError = require('modules/errors/AutoScalingGroupNotFoundError.class');

cacheManager.create('Auto Scaling Groups', getAllAsgsInAccount, { stdTTL: 60 });

let asgCache = cacheManager.get('Auto Scaling Groups');

module.exports = {

  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'asgs',

  create: (resourceDescriptor, parameters) => {
    logger.debug(`Getting ASG client for account "${parameters.accountName}"...`);
    return amazonClientFactory.createASGClient(parameters.accountName).then(
      (client) => {
        let asgResource = new AsgResource(client);

        asgResource.get = (p) => {
          let cacheKey = parameters.accountName;

          if (p.clearCache === true) {
            asgCache.del(cacheKey);
          }
          return asgCache.get(cacheKey).then((allAsgDescriptions) => {
            let autoScalingGroup = _.find(allAsgDescriptions, { AutoScalingGroupName: p.name });

            if (autoScalingGroup) return autoScalingGroup;
            else throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${p.name}" not found.`);
          });
        };

        asgResource.all = (p) => {
          let cacheKey = parameters.accountName;
          let names = new Set(p.names);

          return asgCache.get(cacheKey).then((allAsgDescriptions) => {
            let asgDescriptions = names.size > 0
              ? allAsgDescriptions.filter(x => names.has(x.AutoScalingGroupName))
              : allAsgDescriptions;

            return asgDescriptions;
          });
        };

        return asgResource;
      });
  },
};

function getAllAsgsInAccount(cacheKey) {
  logger.debug(`Describing all ASGs in account "${cacheKey}"...`);
  let accountName = cacheKey;
  let asgDescriptions = amazonClientFactory.createASGClient(accountName)
    .then((client) => {
      let asgResource = new AsgResource(client);
      return asgResource.all({});
    });
  return asgDescriptions;
}
