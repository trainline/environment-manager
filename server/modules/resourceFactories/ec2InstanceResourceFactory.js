/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let amazonClientFactory = require('../amazon-client/childAccountClient');
let Instance = require('../../models/Instance');
let InstanceResourceBase = require('./InstanceResourceBase');

function instanceResource(client) {
  const instanceResourceBase = new InstanceResourceBase(client);
  const self = Object.create(instanceResourceBase);
  self.all = function all(parameters) {
    return instanceResourceBase.all(parameters).then(xs => xs.map(x => new Instance(x)));
  };
  return self;
}

module.exports = {
  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'ec2/instance',

  create: (_, { accountName } = {}) => amazonClientFactory.createEC2Client(accountName).then(instanceResource)
};
