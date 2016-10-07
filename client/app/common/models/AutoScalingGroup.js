/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('AutoScalingGroup',
  function ($q, $http, awsService, resources, roles, serviceDiscovery) {

    function getSummaryFromAsg(asg) {
      var asgSummary = {
        AccountName: asg.AccountName || params.account,
        AsgName: asg.AutoScalingGroupName,
        MinSize: asg.MinSize,
        MaxSize: asg.MaxSize,
        DesiredCapacity: asg.DesiredCapacity,
        CurrentSize: asg.Instances.length,
        LaunchConfigurationName: (asg.LaunchConfigurationName) ? asg.LaunchConfigurationName.replace('LaunchConfig_', '') : null,
        Instances: asg.Instances,
      };
      asg.Tags.forEach(function (tag) {
        asgSummary[tag.Key] = tag.Value;
      });

      return asgSummary;
    }

    function AutoScalingGroup(data) {
      _.assign(this, data);
    }

    _.assign(AutoScalingGroup.prototype, {

      getLaunchConfig: function () {
        var self = this;
        return resources.aws.asgs.getLaunchConfig(this.AccountName, this.AsgName).then(function(data) {
          self.LaunchConfig = data;
          return data;
        });
      },

      getScalingSchedule: function () {
        var self = this;
        return resources.aws.asgs.getScalingSchedule(this.AccountName, this.AsgName).then(function(data) {
          self.ScalingSchedule = data;
          return data;
        });
      },

      updateLaunchConfig: function (data) {
        return resources.aws.asgs.updateLaunchConfig(this.AccountName, this.AsgName, data);
      },

      getDeploymentMapTargetName: function () {
        var name = parseAutoScalingGroupName(this.AsgName);
        return name ? name.serverRole : null;
      },
    });

    function getAsgDetails(asgName, account) {
      return $http.get('/api/v1/asgs/' + asgName, { params: { account: account }}).then(function (response) {
        return getSummaryFromAsg(response.data);
      });
    };

    /**
     * This will fetch AutoScalingGroup along with AMI and LaunchConfig
     */
    AutoScalingGroup.getFullByName = function (account, environmentName, asgName) {
      console.log('EJO!');
      return getAsgDetails(asgName, account).then(function (asgDetails) {
        // Refresh ASG to get up to date list of instance IDs (changes after scaling)
        if (asgDetails) {
          return new AutoScalingGroup(asgDetails);
        } else {
          throw new Error('ASG data not found');
        }
      }).then(function (asg) {
        // Read image data, full Launch Config and Scaling Schedule for ASG
        return awsService.images.GetImageDetails().then(function (amiData) {
          asg.$amiData = amiData; // TODO(filip): that needs to go
          asg.$environmentName = environmentName;
          asg.$accountName = account;

          return asg.getLaunchConfig().then(function (lc) {
            asg.LaunchConfig = lc;

            // Convert Launch Config AMI ID to full AMI with name/version for display
            asg.Ami = awsService.images.GetAmiByID(lc.ImageId, amiData) || {};

            return asg.getScalingSchedule().then(function (ss) {
                asg.ScalingSchedule = ss.ScheduledActions;
                return asg;
            });
          });
        });
      });
    };

    function parseAutoScalingGroupName(name) {
      var segments = name.split('-');
      if (segments.length < 3) return null;

      return {
        environment: segments[0] || null,
        clusterCode: segments[1] || null,
        serverRole: segments[2] || null,
        slice: segments[3] || null,
      };
    }

    return AutoScalingGroup;

  });
