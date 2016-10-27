/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

//TODO: This is a temporary replacement for requirer
let routeHandlerDescriptors = [
  require('routes/api/serversRouteHandlerDescriptor'),
  require('routes/api/instancesRouteHandlerDescriptor'),
  require('routes/api/instanceMaintenanceRouteHandlerDescriptor'),
  require('routes/api/serviceNodesRouteHandlerDescriptor'),
  require('routes/api/tokenRouteHandlerDescriptor'),
  require('routes/api/rolesRouteHandlerDescriptor'),
  require('routes/api/imagesRouteHandlerDescriptor'),
  require('routes/api/environmentsRouteHandlerDescriptor'),
  require('routes/api/nginxUpstreamsRouteHandlerDescriptor'),
  require('routes/api/accountsRouteHandlerDescriptor'),
  require('routes/api/auditRouteHandlerDescriptor'),
  
  // Config  
  require('routes/api/config/slicesRouteHandlerDescriptor'),
  require('routes/api/aws'),

  // Dynamo
  require('routes/api/dynamo/deleteRouteHandlerDescriptor'),
  require('routes/api/dynamo/getRouteHandlerDescriptor'),
  require('routes/api/dynamo/postRouteHandlerDescriptor'),
  require('routes/api/dynamo/putRouteHandlerDescriptor'),
  require('routes/api/dynamo/crossAccountScanRouteHandlerDescriptor'),
  require('routes/api/dynamo/scanRouteHandlerDescriptor'),
  require('routes/api/dynamo/exportRouteHandlerDescriptor'),
  require('routes/api/dynamo/importRouteHandlerDescriptor'),

  // Deployments
  require('routes/api/deployments/deploymentStatusRouteHandlerDescriptor'),
  require('routes/api/deployments/nodeDeploymentLogRouteHandlerDescriptor'),
  require('routes/api/deployments/scanDeploymentStatusRouteHandlerDescriptor'),
  require('routes/api/deployments/deployRouteHandlerDescriptor'),

  // Ops
  require('routes/api/ops/environmentsRouteHandlerDescriptor'),

  // Consul
  require('routes/api/consul/consulKeyValueStoreRouteHandlerDescriptor'),
  require('routes/api/consul/consulCatalogRouteHandlerDescriptor'),

  require('routes/api/asgs/launchConfigRoutes'),
  require('routes/api/asgs/scalingScheduleRoutes'),
  require('routes/api/asgs/autoScalingGroupsRouteHandlerDescriptor'),

  // Diagnostics
  require('routes/api/diagnostics/swaggerRouteHandlerDescriptor'),
  require('routes/api/diagnostics/statusRouteHandlerDescriptor'),
  require('routes/api/diagnostics/endpointsRouteHandlerDescriptor'),
];

function RouteHandlerDescriptor() {
  var self = this;
  var descriptors;

  self.get = () => {
    if (!descriptors) {
      descriptors = getAllDescriptors();
    }

    return descriptors;
  };

  function arrangeDescriptor(descriptor) {
    // Just a trick to have ordering by two fields
    descriptor.priority = descriptor.priority || 0;
    descriptor.method = descriptor.method.toLowerCase();
    return descriptor;
  }

  function getAllDescriptors() {
    var result = [];
    routeHandlerDescriptors.forEach((descriptor) => {
      if (Array.isArray(descriptor)) {
        descriptor.forEach((childDescriptor) => {
          childDescriptor.$name = childDescriptor.$name || descriptor.$name;
          result.push(arrangeDescriptor(childDescriptor));
        });
      } else {
        result.push(arrangeDescriptor(descriptor));
      }
    });

    return result.sort((source, target) => {
      if (source.priority > target.priority) return -1;
      if (source.priority < target.priority) return 1;
      if (source.url > target.url) return -1;
      if (source.url < target.url) return 1;
      if (source.method > target.method) return -1;
      if (source.method < target.method) return 1;
      return 0;
    });
  }
}

module.exports = new RouteHandlerDescriptor();
