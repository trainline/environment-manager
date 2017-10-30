/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const asgResourceFactory = require('./resourceFactories/asgResourceFactory');
const asgScheduledActionsResourceFactory = require('./resourceFactories/asgScheduledActionsResourceFactory');
const ec2ImageResourceFactory = require('./resourceFactories/ec2ImageResourceFactory');
const iamInstanceProfileResourceFactory = require('./resourceFactories/iamInstanceProfileResourceFactory');
const ec2InstanceResourceFactory = require('./resourceFactories/ec2InstanceResourceFactory');
const launchConfigurationResourceFactory = require('./resourceFactories/launchConfigurationResourceFactory');
const nginxUpstreamsResourceFactory = require('./resourceFactories/nginxUpstreamsResourceFactory');
const securityGroupResourceFactory = require('./resourceFactories/securityGroupResourceFactory');

function getInstanceByName(resourceName, parameters) {
  let name = resourceName.toLowerCase();
  switch (name) {
    case 'asgs':
      return asgResourceFactory.create(undefined, parameters);
    case 'asgs-scheduled-actions':
      return asgScheduledActionsResourceFactory.create(undefined, parameters);
    case 'images':
      return ec2ImageResourceFactory.create(undefined, parameters);
    case 'instanceprofiles':
      return iamInstanceProfileResourceFactory.create(undefined, parameters);
    case 'instances':
      return ec2InstanceResourceFactory.create(undefined, parameters);
    case 'launchconfig':
      return launchConfigurationResourceFactory.create(undefined, parameters);
    case 'nginx':
      return nginxUpstreamsResourceFactory.create(undefined, undefined);
    case 'sg':
      return securityGroupResourceFactory.create(undefined, parameters);
    default: {
      return Promise.reject(new Error(`No resource found with name "${resourceName}".`));
    }
  }
}

module.exports = {
  getInstanceByName
};
