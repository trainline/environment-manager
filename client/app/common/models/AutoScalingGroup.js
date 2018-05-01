/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('AutoScalingGroup',
  function ($q, $http, awsService, resources, roles, serviceDiscovery, taggable, accountMappingService) {
    function getSummaryFromAsg(asg) {

      var terminationDelay = 0;
      var emLifecycleHook = _.find(asg.LifecycleHooks, function (lch) {
        return lch.LifecycleHookName === '10min-draining';
      });

      if (emLifecycleHook) {
        terminationDelay = emLifecycleHook.HeartbeatTimeout / 60
      }

      var asgSummary = {
        AccountName: asg.AccountName,
        AsgName: asg.AutoScalingGroupName,
        AvailabilityZones: asg.AvailabilityZones,
        MinSize: asg.MinSize,
        MaxSize: asg.MaxSize,
        DesiredCapacity: asg.DesiredCapacity,
        CurrentSize: asg.Instances.length,
        LaunchConfigurationName: (asg.LaunchConfigurationName) ? asg.LaunchConfigurationName.replace('LaunchConfig_', '') : null,
        IsBeingDeleted: asg.Status === 'Delete in progress',
        Instances: asg.Instances,
        TerminationDelay: terminationDelay,
        Tags: asg.Tags
      };
      asg.Tags.forEach(function (tag) {
        asgSummary[tag.Key] = tag.Value;
      });

      return asgSummary;
    }

    function AutoScalingGroup(data, accountName) {
      _.assign(this, data);
      this.AccountName = accountName;
    }

    taggable(AutoScalingGroup);

    _.assign(AutoScalingGroup.prototype, {

      delete: function () {
        var segments = ['api', 'v1', 'asgs', this.AsgName];
        return $http.delete(segments.join('/'), { params: { environment: this.getTag('Environment') } });
      },

      getLaunchConfig: function () {
        var self = this;
        return $http.get('/api/v1/asgs/' + this.AsgName + '/launch-config', { params: { environment: this.getTag('Environment') } }).then(function (response) {
          self.LaunchConfig = response.data;
          return response.data;
        });
      },

      getScalingSchedule: function () {
        var self = this;
        var segments = ['api', 'v1', 'asgs', this.AsgName, 'scaling-schedule'];
        var url = segments.join('/');

        return $http.get(url, { params: { environment: this.getTag('Environment') } }).then(function (response) {
          self.ScalingSchedule = response.data;
          return response.data;
        });
      },

      updateLaunchConfig: function (data) {
        return $http.put('/api/v1/asgs/' + this.AsgName + '/launch-config?environment=' + this.getTag('Environment'), data);
      },

      updateAutoScalingGroup: function (data) {
        return $http.put('/api/v1/asgs/' + this.AsgName + '?environment=' + this.getTag('Environment'), data);
      },

      getDeploymentMapTargetName: function () {
        var name = parseAutoScalingGroupName(this.AsgName);
        return name ? name.serverRole : null;
      }
    });

    function getAsgDetails(asgName, environmentName) {
      return $http.get('/api/v1/asgs-ec2/' + asgName, { params: { environment: environmentName } }).then(function (response) {
        return getSummaryFromAsg(response.data[0]);
      });
    }

    /**
     * This will fetch AutoScalingGroup along with AMI and LaunchConfig
     */
    AutoScalingGroup.getFullByName = function (environmentName, asgName) {
      var account = accountMappingService.getAccountForEnvironment(environmentName);
      return getAsgDetails(asgName, environmentName).then(function (asgDetails) {
        // Refresh ASG to get up to date list of instance IDs (changes after scaling)
        if (asgDetails) {
          if (asgDetails.IsBeingDeleted) {
            throw new Error('This ASG is currently being deleted');
          } else {
            return new AutoScalingGroup(asgDetails, account);
          }
        } else {
          throw new Error('ASG data not found');
        }
      }).then(function (asg) {
        var imageDetails = null;
        var launchConfiguration = null;
        var scalingSchedule = null;

        return $q.all([getImageDetails(), getLaunchConfiguration(asg), getScalingSchedule(asg)
        ]).then(function (results) {
          imageDetails = results[0];
          launchConfiguration = results[1];
          scalingSchedule = results[2];

          asg.$amiData = imageDetails;
          asg.$environmentName = environmentName;
          asg.$accountName = account;
          asg.LaunchConfig = launchConfiguration;
          asg.ScalingSchedule = scalingSchedule.ScheduledActions;

          asg.Ami = awsService.images.GetAmiByID(asg.LaunchConfig.ImageId, imageDetails) || {};
          return asg;
        });

        function getImageDetails() {
          return awsService.images.GetImageDetails();
        }

        function getLaunchConfiguration(asg) {
          return asg.getLaunchConfig();
        }

        function getScalingSchedule(asg) {
          return asg.getScalingSchedule();
        }
      });
    };

    AutoScalingGroup.updateSchedule = function (environmentName, asgName, newSchedule) {
      return $http({
        method: 'put',
        url: '/api/v1/asgs/' + asgName + '/scaling-schedule?environment=' + environmentName,
        data: {
          propagateToInstances: true,
          schedule: newSchedule
        }
      });
    };

    AutoScalingGroup.resize = function (environmentName, asgName, size) {
      return $http.put('/api/v1/asgs/' + asgName + '/size?environment=' + environmentName, size);
    };

    function parseAutoScalingGroupName(name) {
      var segments = name.split('-');
      if (segments.length < 3) return null;

      return {
        environment: segments[0] || null,
        clusterCode: segments[1] || null,
        serverRole: segments[2] || null,
        slice: segments[3] || null
      };
    }

    return AutoScalingGroup;
  });

