/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let AsgScheduledActionsResource = require('modules/resourceFactories/AsgScheduledActionsResource');
let logger = require('modules/logger');

module.exports = {

  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() == 'asgs-scheduled-actions',

  create: (resourceDescriptor, parameters) => {
    logger.debug(`Getting ASG client for account "${parameters.accountName}"...`);
    return amazonClientFactory.createASGClient(parameters.accountName)
                              .then((client) => new AsgScheduledActionsResource(client));
  },

};
