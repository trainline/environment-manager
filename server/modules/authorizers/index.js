/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const allowAuthenticated = require('./allow-authenticated');
const asgs = require('./asgs');
const deployAuthorizer = require('./deploy-authorizer');
const deployments = require('./deployments');
const environments = require('./environments');
const environmentsSchedule = require('./environments-schedule');
const instances = require('./instances');
const loadBalancerSettings = require('./load-balancer-settings');
const packageUploadUrl = require('./package-upload-url');
const services = require('./services');
const simple = require('./simple');
const toggleServiceStatus = require('./toggle-service-status');
const upstreams = require('./upstreams');

const modules = {
  'allow-authenticated': allowAuthenticated,
  'asgs': asgs,
  'deploy-authorizer': deployAuthorizer,
  'deployments': deployments,
  'environments': environments,
  'environments-schedule': environmentsSchedule,
  'instances': instances,
  'load-balancer-settings': loadBalancerSettings,
  'package-upload-url': packageUploadUrl,
  'services': services,
  'simple': simple,
  'toggle-service-status': toggleServiceStatus,
  'upstreams': upstreams
};

module.exports = modules;
