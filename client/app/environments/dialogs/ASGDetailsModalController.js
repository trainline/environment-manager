/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('ASGDetailsModalController',
  function ($scope, $uibModal, $uibModalInstance, $q, modal, serviceDiscovery, $rootScope, Image, awsService, AutoScalingGroup, resources, cachedResources, deploymentMapConverter, parameters) {
    var vm = this;
    
    vm.context = 'asg';

    var selectedImageVersions = null;
    var amiData = [];
    var environment = parameters.environment;

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
      NewAmi: null,
      NewSchedule: null,
    };

    vm.scheduleModes = [{
      type: 'schedule',
      label: 'Full ASG schedule'
    },{
      type: 'scaling',
      label: 'Scheduled server scaling'
    }];

    function init() {
      resources.aws.instanceTypes.all().then(function (instanceTypes) {
        vm.awsInstanceTypesList = instanceTypes.filter(function (instanceType) {
          return !(instanceType.startsWith('c3') || instanceType.startsWith('m3'));
        });
      }).then(function() {
        vm.refresh(true);
      });
    }

    function initializeScope() {
      vm.asgUpdate.SelectedAction = parameters.defaultAction || 'instances';
      vm.asgUpdate.MinSize = vm.asg.MinSize;
      vm.asgUpdate.DesiredCapacity = vm.asg.DesiredCapacity;
      vm.asgUpdate.MaxSize = vm.asg.MaxSize;
      vm.asgUpdate.NewSchedule = vm.asg.Schedule;
      vm.asgUpdate.ScalingSchedule = vm.asg.ScalingSchedule;
      vm.selectedScheduleMode = vm.asg.ScalingSchedule && vm.asg.ScalingSchedule.length ? 'scaling' : 'schedule';
    }

    vm.openServerRoleConfig = function () {
      $uibModal.open({
        templateUrl: '/app/configuration/deployment-maps/deployment-maps-target-modal.html',
        controller: 'DeploymentMapTargetController as vm',
        size: 'lg',
        resolve: {
          deploymentMap: function () {
            return angular.copy(vm.deploymentMap);
          },

          deploymentTarget: function () {
            return angular.copy(vm.deploymentMapTarget);
          },

          displayMode: function () {
            return 'Edit';
          },
        },
      }).result.then(function () {
        vm.refresh();
      });
    };

    vm.canUser = function () {
      return true; // TODO(filip): add perms - none were used here so far
    };

    vm.formIsValid = function (form) {
      // TODO: Workaround for bug in uniqueAmong directive, returns false positive for disabled control. Can remove this once fixed.
      if (vm.pageMode == 'Edit') {
        return Object.keys(form.$error).length <= 1; // expect 1 error
      } else {
        return form.$valid;
      }
    };

    vm.refresh = function (onInitialization) {
      vm.dataLoading = true;

      $q.all([
        serviceDiscovery.getASGState(parameters.environment.EnvironmentName, parameters.groupName),
        AutoScalingGroup.getFullByName(parameters.environment.EnvironmentName, parameters.groupName),
      ]).then(function (arr) {
        vm.asgState = arr[0];
        vm.asg = arr[1];
        vm.asg.LaunchConfig.UI_SecurityGroupsFlatList = vm.asg.LaunchConfig.SecurityGroups.join(', ');
        vm.target = { // TODO(filip): rename this in launch-config.html to simply "LaunchConfig"
          ASG: {
            LaunchConfig: vm.asg.LaunchConfig 
          }
        };
        amiData = vm.asg.$amiData;
        awsService.images.MergeExtraImageDataToInstances(vm.asgState.Instances, amiData);

      }).then(function () {

        Image.getByName(vm.target.ASG.LaunchConfig.AMI).then(function (ami) {
          var currentSize = vm.target.ASG.LaunchConfig.Volumes[0].Size;
          vm.requiredImageSize = ami === undefined ? currentSize : ami.RootVolumeSize;
        });

        // Refresh deployment map data to pick up any config changes
        resources.config.deploymentMaps.get({ key: environment.Value.DeploymentMap }).then(function (deploymentMap) {
          if (deploymentMap) {
            vm.deploymentMap = angular.copy(deploymentMap);

            // Restructure for use with Target dialog
            vm.deploymentMap.Value.DeploymentTarget = vm.deploymentMap.Value.DeploymentTarget.map(deploymentMapConverter.toDeploymentTarget);

            // Find the corresponding Target for this ASG
            vm.deploymentMapTarget = findDeploymentMapTargetForAsg(vm.asg);
          } else {
            vm.deploymentMapTarget = null;
          }
        }).then(function () {

          // Read selected image versions, sort and add stable indicator
          selectedImageVersions = awsService.images.GetAmiVersionsByType(vm.asgUpdate.ConfiguredAmiType, amiData, false);
          if (selectedImageVersions) {
            selectedImageVersions = awsService.images.SortByVersion(selectedImageVersions);
            selectedImageVersions.map(function addDisplayName(version) {
              version.DisplayName = version.AmiVersion;
              if (version.IsStable) version.DisplayName += ' [Stable]';
            });

            vm.asgUpdate.NewAmi = selectedImageVersions[0];
          }

          vm.dataLoading = false;
        }).then(function () {
          // On initialization scope properties are initialized with ASG details
          // to allow the user to change them through the UI.
          if (onInitialization) {
            initializeScope();
          }
        });
      });

    };

    vm.canResize = function () {
      var somethingHasChanged = (vm.asg.DesiredCapacity != vm.asgUpdate.DesiredCapacity ||
        vm.asg.MinSize != vm.asgUpdate.MinSize ||
        vm.asg.MaxSize != vm.asgUpdate.MaxSize);
      var configIsValid = vm.asgUpdate.DesiredCapacity >= vm.asgUpdate.MinSize &&
        vm.asgUpdate.DesiredCapacity <= vm.asgUpdate.MaxSize;
      return somethingHasChanged && configIsValid;
    };

    // TODO(filip): dry this, same in Server Role modal
    vm.pickAmi = function () {
      var instance = $uibModal.open({
        templateUrl: '/app/configuration/pick-ami/pickami-modal.html',
        controller: 'PickAmiController as vm',
        resolve: {
          currentAmi: function () {
            return vm.target.ASG.LaunchConfig.AMI;
          },
          context: function() {
            return 'asg';
          },
        },
      });
      instance.result.then(function (selectedAmi) {
        vm.target.ASG.LaunchConfig.AMI = selectedAmi.displayName;
        vm.requiredImageSize = selectedAmi.rootVolumeSize;
        vm.target.ASG.LaunchConfig.Volumes[0].Size = selectedAmi.rootVolumeSize;
      });
    };

    vm.updateLaunchConfig = function () {
      var updated = _.clone(vm.target.ASG.LaunchConfig);
      updated.SecurityGroups = vm.target.ASG.LaunchConfig.UI_SecurityGroupsFlatList.split(',').map(_.trim);
      delete updated.UI_SecurityGroupsFlatList;
      vm.asg.updateLaunchConfig(updated).then(function() {
        showLaunchConfigConfirmation();
        vm.refresh();
      }, function (error) {
        $rootScope.$broadcast('error', error);
      });
    };

    vm.resize = function () {
      var min = vm.asgUpdate.MinSize;
      var desired = vm.asgUpdate.DesiredCapacity;
      var max = vm.asgUpdate.MaxSize;

      AutoScalingGroup.resize(vm.environmentName, vm.asg.AsgName, { min: min, desired: desired, max: max }).then(function () {
        modal.information({
          title: 'ASG Resized',
          message: 'ASG resize successful. You can monitor instance changes by using the Refresh Icon in the top right of the window.<br/><br/><b>Note:</b> During scale-down instances will wait in a Terminating state for 10 minutes to allow for connection draining before termination.',
        }).then(function () {
          vm.refresh();
        });
      });
    };

    vm.closeModal = function () {
      $uibModalInstance.close();
    };

    function showLaunchConfigConfirmation() {
      modal.information({
        title: 'ASG Launch Configuration Updated',
        message: 'Launch Configuration updated successfully.<br/><br/><b>PLEASE NOTE:</b> This change does not affect any existing instances. To rollout the change to existing instances:<ul><li>Resize the ASG to double its current size</li><li>Wait for the new instances to be brought into service</li><li>Resize the ASG to its original size again. This will remove older instances first leaving only those with the latest settings',
      });
    }
    
    vm.changeAsgSchedule = function () {

      var newSchedule;
      if (vm.selectedScheduleMode === 'scaling') {
        newSchedule = vm.asgUpdate.ScalingSchedule.map(function(schedule) {
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

      AutoScalingGroup.updateSchedule(vm.environmentName, vm.asg.AsgName, newSchedule).then(function () {
        resetForm();
        modal.information({
          title: 'ASG Schedule Updated',
          message: 'ASG schedule updated successfully.',
        }).then(function () {
          vm.refresh();
        });
      });
    };


    function findDeploymentMapTargetForAsg(asg) {
      // Find by name and owning cluster
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
      var validDesiredCapacities = vm.asgUpdate.ScalingSchedule.every(function(schedule){ return typeof(schedule.DesiredCapacity) !== 'undefined'; });

      var validScalingSchedule = scalingSchedulePresent && validDesiredCapacities;
      return validScalingSchedule;
    };

    vm.greaterThanLowestDesiredSizeScheduled = function (minSize) {
      var desiredSizes = _.map(vm.asg.ScalingSchedule, 'DesiredCapacity');
      var lowestDesiredSizeScheduled = _.min(desiredSizes);
      return minSize > lowestDesiredSizeScheduled;
    };

    vm.lessThanHighestDesiredSizeScheduled = function (maxSize) {
      var desiredSizes = _.map(vm.asg.ScalingSchedule, 'DesiredCapacity')
      var highestDesiredSizeScheduled = _.max(desiredSizes);
      return maxSize < highestDesiredSizeScheduled;
    };

    init();
  });
