/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').factory('AsgDistributionService', function() {

  function friendlyAZName(az) {
    return az.substring(az.length - 1).toUpperCase();
  }

  function calcDistribution (allAZs, asg) {
    var azs = allAZs.map(function(az){
      var instances = asg.Instances.filter(function(instance) {
        return az == friendlyAZName(instance.AvailabilityZone);
      });
      var active = asg.AvailabilityZones.some(function(usedAZ){ return az === friendlyAZName(usedAZ); });
      return {
        name: az,
        active: active,
        projectedChanges: 0,
        nodes: instances.map(function(instance){
          return {
            id: instance.InstanceId,
            isOld: !instance.LaunchConfigurationName,
            isProtected: instance.ProtectedFromScaleIn
          };
        })
      };
    });

    var distribution = {
      azs: azs
    };

    return distribution;
  }

  return {
    calcDistribution: calcDistribution
  };

});