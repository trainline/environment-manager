/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').factory('AsgDistributionService', function() {

  function friendlyAZName(az) {
    return az.substring(az.length - 1).toUpperCase();
  }

  function calcDistribution (allAZs, asg, numDesiredNodes) {
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
            isOld: !instance.LaunchConfigurationName
          };
        })
      };
    });

    // updateProjectedChanges(azs, numDesiredNodes);

    var distribution = {
      azs: azs
    };

    return distribution;
  }

  /*function updateProjectedChanges (azs, desiredNodes) {
    var numCurrentNodes = _.sum(azs.map(function(az){ return nodes.length; }));

    if (numCurrentNodes === desiredNodes)
      return;

    if (numCurrentNodes < desiredNodes)
      return scaleOut(azs, desiredNodes - numCurrentNodes);

    return scaleIn(azs, numCurrentNodes - desiredNodes);
  }

  function scaleIn(azs, numNodesToRemove) {
    _.times(numNodesToRemove, function() {
      decrementNodesCount(azs);
    });
  }

  function decrementNodesCount(azs) {
    var maxNodes = _.maxBy(azs, function(az){ return az.nodes.length; });
    var selectedAZs = azs.filter(function(az){ return az.nodes.length === maxNodes; });
    selectedAZs[0].projectedNodes
  }*/

  return {
    calcDistribution: calcDistribution
  };

});