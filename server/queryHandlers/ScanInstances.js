/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const ec2InstanceResourceFactory = require('../modules/resourceFactories/ec2InstanceResourceFactory');

module.exports = function ScanInstancesQueryHandler({ accountName, filter }) {
  return ec2InstanceResourceFactory.create(undefined, { accountName })
    .then(x => x.all({ filter }));
};
