/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').factory('deploymentMapConverter',
  function () {
    function findVolumeSize(volumes, name) {
      var volume = _.find(volumes, { Name: name });
      if (volume) return volume.Size;
    }

    function findVolumeType(volumes, name) {
      var volume = _.find(volumes, { Name: name });
      if (volume) return volume.Type;
    }

    // Converts between Dyanmo schema and easier per-target format for UI
    // TODO: if schema is updated so each target is a separate record, this service will no longer be required
    return {
      toDeploymentTarget: function (data) {
        // Adjust schema to reflect preferred model
        var deploymentTarget = {
          ServerRoleName: data.ServerRoleName,
          OwningCluster: data.OwningCluster,
          SecurityZone: data.SecurityZone,
          FleetPerSlice: data.FleetPerSlice || false,
          ASG: {
            DesiredCapacity: data.AutoScalingSettings.DesiredCapacity || 0,
            MinCapacity: data.AutoScalingSettings.MinCapacity || 0,
            MaxCapacity: data.AutoScalingSettings.MaxCapacity || 0,
            SubnetTypeName: data.SubnetTypeName || 'PrivateApp',
            AvailabilityZone: data.AvailabilityZoneName || '',
            LaunchConfig: {
              AMI: data.AMI,
              InstanceType: data.InstanceType,
              Key: data.ClusterKeyName,
              SecurityGroups: data.SecurityGroups,
              InstanceProfileName: data.InstanceProfileName,
              UI_UseSpecificKey: data.ClusterKeyName ? true : false, // UI helper
              UI_SecurityGroupsFlatList: data.SecurityGroups ? data.SecurityGroups.join(', ') : '', // UI Helper
              Volumes: [
                _.find(data.Volumes, { Name: 'OS' }),
                _.find(data.Volumes, { Name: 'Data' })
              ],
              PuppetRole: data.PuppetRole
            },
            Tags: {
              ContactEmail: data.ContactEmailTag,
              Role: data.RoleTag,
              Schedule: data.ScheduleTag,
              RemovalDate: data.RemovalDateTag,
              ProjectCode: data.ProjectCodeTag
            }
          },
          Services: data.Services
        };

        return deploymentTarget;
      },

      toDynamoSchema: function (target) {
        var sgList = _.trim(target.ASG.LaunchConfig.UI_SecurityGroupsFlatList) || '';
        var sgs = sgList.length > 0 ? sgList.split(',').map(_.trim) : undefined;

        var deploymentMapValue = {
          ServerRoleName: target.ServerRoleName,
          OwningCluster: target.OwningCluster,
          SecurityZone: target.SecurityZone,
          FleetPerSlice: target.FleetPerSlice,
          AutoScalingSettings: {
            DesiredCapacity: target.ASG.DesiredCapacity || 0,
            MinCapacity: target.ASG.MinCapacity || 0,
            MaxCapacity: target.ASG.MaxCapacity || 0
          },
          SubnetTypeName: target.ASG.SubnetTypeName,
          AvailabilityZoneName: (target.ASG.AvailabilityZone && target.ASG.AvailabilityZone != '') ? target.ASG.AvailabilityZone : undefined,
          AMI: target.ASG.LaunchConfig.AMI,
          InstanceType: target.ASG.LaunchConfig.InstanceType,
          ClusterKeyName: target.ASG.LaunchConfig.UI_UseSpecificKey && target.ASG.LaunchConfig.Key ? target.ASG.LaunchConfig.Key : undefined,
          InstanceProfileName: target.ASG.LaunchConfig.InstanceProfileName,
          SecurityGroups: sgs,
          ContactEmailTag: target.ASG.Tags.ContactEmail,
          Volumes: [{
            Name: 'OS',
            Size: target.ASG.LaunchConfig.Volumes[0].Size || 50,
            Type: 'SSD'
          }, {
            Name: 'Data',
            Size: target.ASG.LaunchConfig.Volumes[1].Size || 10,
            Type: target.ASG.LaunchConfig.Volumes[1].Type || 'Disk'
          }],
          PuppetRole: target.ASG.LaunchConfig.PuppetRole,
          RoleTag: target.ASG.Tags.Role,
          ScheduleTag: target.ASG.Tags.Schedule,
          RemovalDateTag: target.ASG.Tags.RemovalDate,
          ProjectCodeTag: target.ASG.Tags.ProjectCode,
          Services: target.Services
        };

        return deploymentMapValue;
      }
    };
  });
