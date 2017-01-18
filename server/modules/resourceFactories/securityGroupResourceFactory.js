/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let SecurityGroupResource = require('./SecurityGroupResource');

module.exports = {

  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'ec2/sg',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createEC2Client(parameters.accountName).then(client => new SecurityGroupResource(client))

};
