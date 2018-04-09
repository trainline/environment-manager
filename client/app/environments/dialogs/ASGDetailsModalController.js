/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').controller('ASGDetailsModalController',
  function ($http, $scope, $uibModal, $uibModalInstance, $q, modal, loading, serviceDiscovery, Image, awsService, AutoScalingGroup, resources, cachedResources, deploymentMapConverter, asgDistributionService, accountMappingService, parameters, DeploymentMap) {
    var vm = this;

    vm.context = 'asg';

    var selectedImageVersions = null;
    var amiData = [];
    var environment = parameters.environment;
    var launchConfigForm;

    vm.awsInstanceTypesList = [];
    vm.deploymentMap = null;
    vm.deploymentMapTarget = null;
    vm.environmentName = environment.EnvironmentName;
    vm.asg = null;
    vm.serverData = [];
    vm.dataLoading = true;
    vm.asgUpdate = {
      SelectedAction: '',
      MinSize: 0,
      DesiredCapacity: 0,
      MaxSize: 0,
      ConfiguredAmiType: '',
      ConfiguredAmiVersion: '',
      AvailabilityZone: '',
      NewAmi: null,
      NewSchedule: null
    };
    vm.deploymentAzsList = ['A', 'B', 'C'];

    vm.scheduleModes = [{
      type: 'schedule',
      label: 'Simple (On/Off)'
    }, {
      type: 'scaling',
      label: 'Scaling'
    }];

    vm.upstreamStatusData = {};

    function init() {
      resources.aws.instanceTypes.all().then(function (instanceTypes) {
        vm.awsInstanceTypesList = instanceTypes.filter(function (instanceType) {
          return !(_.startsWith(instanceType.trim(), 'c3') || _.startsWith(instanceType.trim(), 'm3'));
        });
      }).then(function () {
        vm.refresh(true);
      });
    }

    function initializeScope() {
      vm.asgUpdate = vm.asg;
      vm.asgUpdate.SelectedAction = parameters.defaultAction || 'instances';
      vm.asgUpdate.AvailabilityZone = deriveAvailabilityZoneFriendlyName(vm.asgUpdate.AvailabilityZones);
      vm.asgUpdate.NewSchedule = vm.asg.Schedule;
      vm.selectedScheduleMode = vm.asgUpdate.ScalingSchedule && vm.asgUpdate.ScalingSchedule.length ? 'scaling' : 'schedule';
    }

    vm.isAZChecked = function (az) {
      return _.includes(vm.asgUpdate.AvailabilityZone, az);
    };

    vm.toggleAZSelection = function (az) {
      if (_.includes(vm.asgUpdate.AvailabilityZone, az)) {
        _.remove(vm.asgUpdate.AvailabilityZone, function (item) { return item === az; });
      } else {
        vm.asgUpdate.AvailabilityZone.push(az);
      }
    };

    function deriveAvailabilityZoneFriendlyName(azs) {
      return azs.map(function (az) { return az.slice(-1).toUpperCase(); });
    }

    vm.setLaunchConfigForm = function (form) {
      launchConfigForm = form;
    };

    vm.openServerRoleConfig = function () {
      $uibModal.open({
        templateUrl: '/app/configuration/deployment-maps/deployment-maps-target-modal.html',
        controller: 'DeploymentMapTargetController as vm',
        size: 'lg',
        resolve: {
          deploymentMap: function () {
            return DeploymentMap.create(angular.copy(vm.deploymentMap));
          },

          deploymentTarget: function () {
            return angular.copy(vm.deploymentMapTarget);
          },

          displayMode: function () {
            return 'Edit';
          }
        }
      }).result.then(function () {
        vm.refresh();
      });
    };

    vm.canUser = function () {
      return true;
    };

    vm.updateASGFormIsValid = function () {
      return !!vm.asgUpdate.AvailabilityZone.length &&
        !(vm.asgUpdate.DesiredCapacity < vm.asgUpdate.MinSize) &&
        !(vm.asgUpdate.DesiredCapacity > vm.asgUpdate.MaxSize) &&
        !vm.greaterThanLowestDesiredSizeScheduled(vm.asgUpdate.MinSize) &&
        !vm.lessThanHighestDesiredSizeScheduled(vm.asgUpdate.MaxSize);
    };

    vm.formIsValid = function (form) {
      if (vm.pageMode == 'Edit') {
        return Object.keys(form.$error).length <= 1;
      } else {
        return form.$valid;
      }
    };

    $scope.$on('InstanceTerminating', function () {
      vm.refresh();
    })

    vm.refresh = function (onInitialization) {
      vm.dataLoading = true;
      vm.loadingUpstreamStatus = true;

      var environmentName = parameters.environment.EnvironmentName;
      var asgName = parameters.groupName;
      $q.all([
        serviceDiscovery.getASGState(environmentName, asgName),
        AutoScalingGroup.getFullByName(environmentName, asgName)
      ]).then(function (arr) {
        vm.asgState = arr[0];
        vm.asg = arr[1];
        vm.asg.LaunchConfig.UI_SecurityGroupsFlatList = vm.asg.LaunchConfig.SecurityGroups.join(', ');
        vm.target = {
          ASG: {
            LaunchConfig: vm.asg.LaunchConfig
          }
        };
        amiData = vm.asg.$amiData;
        awsService.images.MergeExtraImageDataToInstances(vm.asgState.Instances, amiData);

        Image.getByName(vm.target.ASG.LaunchConfig.AMI).then(function (ami) {
          var currentSize = vm.target.ASG.LaunchConfig.Volumes[0].Size;
          vm.requiredImageSize = !_.isObject(ami) ? currentSize : ami.RootVolumeSize;
        });

        function setupDeploymentMapLink() {
          resources.config.deploymentMaps.get({ key: environment.Value.DeploymentMap }).then(function (deploymentMap) {
            if (deploymentMap) {
              vm.deploymentMap = angular.copy(deploymentMap);
              vm.deploymentMap.Value.DeploymentTarget = vm.deploymentMap.Value.DeploymentTarget.map(deploymentMapConverter.toDeploymentTarget);
              vm.deploymentMapTarget = findDeploymentMapTargetForAsg(vm.asg);
            } else {
              vm.deploymentMapTarget = null;
            }
          })
        }

        function getSortedStableImageVersions() {
          selectedImageVersions = awsService.images.GetAmiVersionsByType(vm.asgUpdate.ConfiguredAmiType, amiData, false);
          if (selectedImageVersions) {
            selectedImageVersions = awsService.images.SortByVersion(selectedImageVersions);
            selectedImageVersions.map(function addDisplayName(version) {
              version.DisplayName = version.AmiVersion;
              if (version.IsStable) version.DisplayName += ' [Stable]';
            });

            vm.asgUpdate.NewAmi = selectedImageVersions[0];
          }

          vm.currentDistribution = asgDistributionService.calcDistribution(vm.deploymentAzsList, vm.asg);
          vm.getLBStatus().finally(function () {
            vm.loadingUpstreamStatus = false;
          });

          vm.dataLoading = false;
        }

        $q.all([
          setupDeploymentMapLink(),
          getSortedStableImageVersions()
        ]).then(function () {
          initializeScope();
        });
      }, function (error) {
        vm.closeModal();
      });
    };

    vm.getLBStatus = function () {
      var env = parameters.environment.EnvironmentName;
      var params = { account: 'all' };

      return resources.config.lbUpstream.all(params).then(function (upstreams) {
        return vm.getLBData(env).then(function (lbs) {
          var instances = vm.asgState.Instances;

          vm.upstreamStatusData.lbs = lbs;
          vm.upstreamStatusData.upstreams = upstreams;
          vm.upstreamStatusData.instances = instances;
        });
      });
    }

    vm.getLBData = function (env) {
      return accountMappingService.getEnvironmentLoadBalancers(env).then(function (lbNames) {
        return $q.all(lbNames.map(function (lbName) {
          var url = ['api', 'v1', 'load-balancer', lbName].join('/');
          return $http.get(url).then(function (response) {
            var upstreams = response.data;
            return {
              name: lbName,
              upstreams: upstreams
            };
          });
        }));
      });
    }

    vm.canResize = function () {
      var somethingHasChanged = (vm.asg.DesiredCapacity != vm.asgUpdate.DesiredCapacity ||
        vm.asg.MinSize != vm.asgUpdate.MinSize ||
        vm.asg.MaxSize != vm.asgUpdate.MaxSize);
      var configIsValid = vm.asgUpdate.DesiredCapacity >= vm.asgUpdate.MinSize &&
        vm.asgUpdate.DesiredCapacity <= vm.asgUpdate.MaxSize;
      return somethingHasChanged && configIsValid;
    };

    vm.pickAmi = function () {
      var instance = $uibModal.open({
        templateUrl: '/app/configuration/pick-ami/pickami-modal.html',
        controller: 'PickAmiController as vm',
        resolve: {
          currentAmi: function () {
            return vm.target.ASG.LaunchConfig.AMI;
          },
          context: function () {
            return 'asg';
          }
        }
      });
      instance.result.then(function (selectedAmi) {
        vm.target.ASG.LaunchConfig.AMI = selectedAmi.displayName;
        vm.requiredImageSize = selectedAmi.rootVolumeSize;
        vm.target.ASG.LaunchConfig.Volumes[0].Size = _.max([vm.requiredImageSize, vm.target.ASG.LaunchConfig.Volumes[0].Size]);
        launchConfigForm.$setDirty(true);
      });
    };

    vm.updateLaunchConfig = function () {
      var updated = _.clone(vm.target.ASG.LaunchConfig);
      updated.SecurityGroups = vm.target.ASG.LaunchConfig.UI_SecurityGroupsFlatList.split(',').map(_.trim);
      delete updated.UI_SecurityGroupsFlatList;
      vm.asg.updateLaunchConfig(updated).then(function () {
        showLaunchConfigConfirmation().then(vm.refresh);
      });
    };

    vm.updateAutoScalingGroup = function () {
      confirmAZChange()
        .then(createUpdatedAsgModel)
        .then(sendAsgUpdate);

      function createUpdatedAsgModel() {
        return {
          size: {
            min: vm.asgUpdate.MinSize,
            desired: vm.asgUpdate.DesiredCapacity,
            max: vm.asgUpdate.MaxSize
          },
          scaling: {
            terminationDelay: vm.asgUpdate.TerminationDelay
          },
          network: {
            availabilityZoneName: vm.asgUpdate.AvailabilityZone
          }
        };
      }

      function sendAsgUpdate(updated) {
        return vm.asg.updateAutoScalingGroup(updated)
          .then(function () {
            modal.information({
              title: 'ASG Update Sent',
              message: '<div class="alert alert-info">ASG update sent. Environment Manager will synchronise with AWS shortly.</div><br> You can monitor instance changes by using the Refresh Icon in the top right of the window.<br/><br/><b>Note:</b> During scale-down instances will wait in a Terminating state for 10 minutes to allow for connection draining before termination.'
            });
          })
          .finally(function () {
            vm.refresh();
          });
      }
    };

    function confirmAZChange() {
      var originalAvailabilityZone = deriveAvailabilityZoneFriendlyName(vm.asg.AvailabilityZones).sort();
      if (_.isEqual(originalAvailabilityZone, vm.asgUpdate.AvailabilityZone.sort())) {
        return Promise.resolve(true);
      }

      return modal.confirmation({
        title: 'Change Availability Zones',
        message: '<div class="alert alert-info">It will take a moment for Environment Manager to synchronise with AWS. You can monitor instance changes by using the Refresh Icon in the top right of the window.</div><br>Are you sure you want to change the AZ settings?',
        severity: 'Danger'
      });
    }

    vm.resize = function () {
      var min = vm.asgUpdate.MinSize;
      var desired = vm.asgUpdate.DesiredCapacity;
      var max = vm.asgUpdate.MaxSize;

      return AutoScalingGroup.resize(vm.environmentName, vm.asg.AsgName, { min: min, desired: desired, max: max }).then(function () {
        return modal.information({
          title: 'ASG Resized',
          message: 'ASG resize successful. You can monitor instance changes by using the Refresh Icon in the top right of the instances window.<br/><br/><b>Note:</b> During scale-down instances will wait in a Terminating state for 10 minutes to allow for connection draining before termination.'
        });
      });
    };

    vm.closeModal = function () {
      $uibModalInstance.close();
    };

    function showLaunchConfigConfirmation() {
      var instance = $uibModal.open({
        templateUrl: '/app/environments/dialogs/asg/launchConfigConfirmation.html',
        controller: 'LaunchConfigConfirmationController as vm',
        resolve: {
          parameters: function () { return { asg: vm.asg }; }
        }
      });
      return instance.result.then(function (result) {
        if (result.doScalingRefresh) {
          vm.asgUpdate.DesiredCapacity = result.numInstancesForRefresh;
          if (vm.asgUpdate.MaxSize < result.numInstancesForRefresh) {
            vm.asgUpdate.MaxSize = result.numInstancesForRefresh;
          }
          return vm.resize();
        }
      });
    }

    vm.changeAsgSchedule = function () {
      var newSchedule;
      if (vm.selectedScheduleMode === 'scaling') {
        newSchedule = vm.asgUpdate.ScalingSchedule.map(function (schedule) {
          return {
            MinSize: vm.asg.MinSize,
            MaxSize: vm.asg.MaxSize,
            DesiredCapacity: schedule.DesiredCapacity,
            Recurrence: schedule.Recurrence
          };
        });
      } else {
        newSchedule = vm.asgUpdate.NewSchedule;
      }

      return AutoScalingGroup.updateSchedule(vm.environmentName, vm.asg.AsgName, newSchedule).then(function () {
        modal.information({
          title: 'ASG Schedule Update Sent',
          message: '<div class="alert alert-info">It will take a moment for Environment Manager to synchronise with AWS. You can monitor instance changes by using the Refresh Icon in the top right of the window.</div>'
        });
      }).catch(function (err) {
        if (err.status === 404) {
          modal.error('Error', 'An error has occurred: ' + err.data.error);
        } else {
          throw err;
        }
      }).finally(function () {
        resetForm();
        vm.refresh();
      });
    };


    function findDeploymentMapTargetForAsg(asg) {
      var targetName = asg.getDeploymentMapTargetName();
      return _.find(vm.deploymentMap.Value.DeploymentTarget, { OwningCluster: asg.OwningCluster, ServerRoleName: targetName });
    }

    function resetForm() {
      vm.asgUpdate.MinSize = vm.asg.MinSize;
      vm.asgUpdate.DesiredCapacity = vm.asg.DesiredCapacity;
      vm.asgUpdate.MaxSize = vm.asg.MaxSize;
    }

    vm.canSubmit = function () {
      if (vm.selectedScheduleMode !== 'scaling') {
        return vm.asgUpdate.NewSchedule !== 'NOSCHEDULE';
      }

      var scalingSchedulePresent = vm.asgUpdate.ScalingSchedule.length;
      var validDesiredCapacities = vm.asgUpdate.ScalingSchedule.every(function (schedule) { return typeof (schedule.DesiredCapacity) !== 'undefined'; });

      var validScalingSchedule = scalingSchedulePresent && validDesiredCapacities;
      return validScalingSchedule;
    };

    vm.greaterThanLowestDesiredSizeScheduled = function (minSize) {
      var desiredSizes = _.map(vm.asg.ScalingSchedule, 'DesiredCapacity');
      var lowestDesiredSizeScheduled = _.min(desiredSizes);
      return minSize > lowestDesiredSizeScheduled;
    };

    vm.lessThanHighestDesiredSizeScheduled = function (maxSize) {
      var desiredSizes = _.map(vm.asg.ScalingSchedule, 'DesiredCapacity');
      var highestDesiredSizeScheduled = _.max(desiredSizes);
      return maxSize < highestDesiredSizeScheduled;
    };

    init();
  });

