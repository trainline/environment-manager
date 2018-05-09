/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').controller('DeploymentMapTargetController',
  function ($scope, $location, $uibModalInstance, $uibModal, $q, Image, resources, cachedResources, modal, deploymentMap, deploymentTarget, deploymentMapConverter, displayMode, awsService, teamstorageservice) {
    var vm = this;
    var userHasPermission;
    var servicesList = []; // Full list of service names across system

    vm.pageMode = displayMode; // Edit, New, Clone
    vm.target = deploymentTarget;
    vm.owningClustersList = [];
    vm.securityZonesList = [];
    vm.awsInstanceTypesList = [];
    vm.AZOptions = [
      { Name: 'Span all active AZs (recommended)', Value: 'all' },
      { Name: 'Span specific AZs..', Value: 'some' }
    ];
    vm.deploymentAzsList = ['A', 'B', 'C'];
    vm.availableServices = []; // Filtered to services able to be added to this target
    vm.deploymentMethodsList = [];
    vm.serverRoleNames = getAllServerRoleNames();
    vm.requiredImageSize = 0;
    vm.context = 'serverRole';
    vm.usePredefinedSubnet = false;

    function init() {
      userHasPermission = user.hasPermission({ access: 'PUT', resource: '/config/deploymentmaps/' + deploymentMap.DeploymentMapName });

      if (vm.pageMode == 'Clone') {
        vm.target.ServerRoleName = '';
        vm.target.ASG.Tags.Role = '';
        vm.target.Services = []; // Can't clone service list as services need to be unique within Deployment Map
      }

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = _.sortBy(clusters, 'ClusterName');
        }),

        resources.securityZones.all().then(function (securityZones) {
          vm.securityZonesList = securityZones;
        }),

        resources.deployment.methods.all().then(function (deploymentMethods) {
          vm.deploymentMethodsList = deploymentMethods;
        }),

        cachedResources.config.services.all().then(function (services) {
          servicesList = _.sortBy(services, 'ServiceName');
        }),

        resources.aws.instanceTypes.all().then(function (instanceTypes) {
          vm.awsInstanceTypesList = instanceTypes.filter(function (instanceType) {
            return !(_.startsWith(instanceType, 'c3') || _.startsWith(instanceType, 'm3'));
          });
        })
      ]).then(function () {
        if (vm.pageMode == 'New') {
          // Set defaults for new server roles
          var newTarget = {
            ServerRoleName: '',
            FleetPerSlice: false,
            OwningCluster: teamstorageservice.get(vm.owningClustersList[0].ClusterName),
            SecurityZone: vm.securityZonesList[0],
            ASG: {
              MinCapacity: 0,
              DesiredCapacity: 1,
              MaxCapacity: 1,
              DelayedTermination: 3,
              SubnetTypeName: 'PrivateApp',
              AvailabilityZoneSelection: 'all',
              AvailabilityZone: '',
              LaunchConfig: {
                InstanceType: 'm3.medium',
                UI_UseSpecificKey: false,
                Volumes: [
                  {
                    Name: 'OS',
                    Size: 50,
                    Type: 'SSD'
                  },
                  {
                    Name: 'Data',
                    Size: 50,
                    Type: 'Disk'
                  }
                ]
              },
              Tags: {
                ContactEmail: vm.owningClustersList[0].Value.GroupEmailAddress
              }
            },
            Services: []
          };
          vm.target = newTarget;
        } else {
          if (vm.target.ASG.AvailabilityZone) {
            vm.target.ASG.AvailabilityZoneSelection = 'some';
            vm.target.ASG.AvailabilityZone = _.toArray(vm.target.ASG.AvailabilityZone);
          } else {
            vm.target.ASG.AvailabilityZoneSelection = 'all';
          }

          Image.getByName(vm.target.ASG.LaunchConfig.AMI).then(function (ami) {
            var currentSize = vm.target.ASG.LaunchConfig.Volumes[0].Size;
            vm.requiredImageSize = ami === undefined ? currentSize : ami.RootVolumeSize;
            vm.target.ASG.LaunchConfig.AMIPlatform = ami.Platform;
          });
        }

        updateAvailableServices();
      });
    }

    vm.azSelectionIsValid = function () {
      return vm.target.ASG.AvailabilityZoneSelection === 'all' || !!vm.target.ASG.AvailabilityZone.length;
    };

    vm.isAZChecked = function (az) {
      if (!_.isArray(vm.target.ASG.AvailabilityZone)) {
        vm.target.ASG.AvailabilityZone = _.clone(vm.deploymentAzsList);
      }

      return _.includes(vm.target.ASG.AvailabilityZone, az);
    };

    vm.toggleAZSelection = function (az) {
      if (_.includes(vm.target.ASG.AvailabilityZone, az)) {
        _.remove(vm.target.ASG.AvailabilityZone, function (item) { return item === az; });
      } else {
        vm.target.ASG.AvailabilityZone.push(az);
      }
    };

    vm.linkTo = function (docName) {
      return window.links.SECURITY_ZONES;
    };

    vm.selectableSubnets = function () {
      return ['PrivateApp', 'PrivateSecure', 'PrivateShared', 'PublicSecure'];
    };

    vm.owningClusterUpdated = function () {
      if (isClusterEmail(vm.target.ASG.Tags.ContactEmail)) {
        vm.target.ASG.Tags.ContactEmail = getClusterByName(vm.target.OwningCluster).Value.GroupEmailAddress;
      }

      updateAvailableServices();
    };

    vm.canUser = function () {
      return userHasPermission;
    };

    vm.ok = function () {
      if (vm.target.ASG.AvailabilityZoneSelection === 'all') {
        vm.target.ASG.AvailabilityZone = '';
      }

      vm.target.ASG.Tags.Schedule = '';
      vm.target.ASG.Tags.Role = vm.target.ServerRoleName;

      Promise.all([validateDataForPuppetRole(), validateDataForDesiredCapacity()])
        .then(() => updateDeploymentMapValueWithViewModel())
        .then(() => deploymentMap.update())
        .then(() => cachedResources.config.deploymentMaps.flush())
        .finally(() => $uibModalInstance.close())
        .catch(() => {})

    };

    vm.cancel = function () {
      // TODO: bug - error in console when dialog dismissed with ESC key. Related to tree control somehow.
      $uibModalInstance.dismiss('cancel');
    };

    vm.navigateHome = function () {
      modal.confirmation({
        title: 'Navigate Away',
        message: 'Are you sure you want to navigate away from this dialog? Changes will not be saved.',
        action: 'OK'
      }).then(function () {
        $uibModalInstance.dismiss('cancel');
        $location.path('/');
      });
    };

    vm.formIsValid = function (form) {
      // TODO: Workaround for bug in uniqueAmong directive, returns false positive for disabled control. Can remove this once fixed.
      if (vm.pageMode == 'Edit') {
        return Object.keys(form.$error).length <= 1; // expect 1 error
      } else {
        return form.$valid;
      }
    };

    vm.addService = function (newService) {
      if (newService === null || newService === undefined) return;
      vm.target.Services.push(newService);
      updateAvailableServices();
    };

    vm.deleteTargetService = function (serviceName) {
      vm.target.Services = vm.target.Services.filter(function (service) {
        return (service.ServiceName != serviceName);
      });
      updateAvailableServices();
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
            return 'serverRole';
          }
        }
      });

      instance.result.then(function (selectedAmi) {
        vm.target.ASG.LaunchConfig.AMI = selectedAmi.displayName;
        vm.target.ASG.LaunchConfig.AMIPlatform = selectedAmi.platform;
        vm.requiredImageSize = selectedAmi.rootVolumeSize;
        vm.target.ASG.LaunchConfig.Volumes[0].Size = _.max([vm.requiredImageSize, vm.target.ASG.LaunchConfig.Volumes[0].Size]);
      });
    };

    function getClusterByName(name) {
      return _.find(vm.owningClustersList, { ClusterName: name });
    }

    function isClusterEmail(email) {
      return _.some(vm.owningClustersList, function (cluster) {
        return cluster.Value.GroupEmailAddress == email;
      });
    }

    function getAllServerRoleNames() {
      return _.map(deploymentMap.Value.DeploymentTarget, 'ServerRoleName');
    }

    function validateDataForPuppetRole() {
      if (vm.target.ASG.LaunchConfig.AMIPlatform == 'Linux' && typeof vm.target.ASG.LaunchConfig.PuppetRole == 'undefined') {
        return modal.confirmation({
          title: 'Linux AMI/Puppet Role Warning',
          message: 'It looks like you have chosen a linux AMI and not specified a puppet role. This can lead to problems later on when you deploy to an environment. Please ask on the #linux-infra channel in slack if you need help defining one. Do you want to continue?'
        });
      }
      return Promise.resolve();
    }

    function validateDataForDesiredCapacity() {
      var min = vm.target.ASG.MinCapacity;
      var desired = vm.target.ASG.DesiredCapacity;
      var max = vm.target.ASG.MaxCapacity;
      if (desired < min || desired > max) {
        modal.information({
          title: 'ASG Sizing Error',
          message: 'Desired capacity must be between min and max sizes'
        });
      }
      return Promise.resolve();
    }

    function updateDeploymentMapValueWithViewModel() {
      if (vm.pageMode == 'Edit') {
        deploymentMap.Value.DeploymentTarget.forEach(function (target) {
          if (target.ServerRoleName == vm.target.ServerRoleName && target.OwningCluster == vm.target.OwningCluster) {
            angular.copy(vm.target, target);
          }
        });
      } else {
        deploymentMap.Value.DeploymentTarget.push(vm.target);
      }
    }

    function updateAvailableServices() {
      // Get all services that aren't used by this deployment map
      var availableServices = _.differenceBy(servicesList, vm.target.Services, 'ServiceName');
      _.sortBy(availableServices, 'ServiceName');

      // Find in which other ServerRoles is service in
      vm.target.Services.forEach(function (service) {
        service.$otherServerRoles = [];
      });

      vm.target.Services.forEach(function (service) {
        deploymentMap.Value.DeploymentTarget.forEach(function (item) {
          if (item.ServerRoleName === vm.target.ServerRoleName) return;

          if (_.some(item.Services, { ServiceName: service.ServiceName })) {
            service.$otherServerRoles.push(item.ServerRoleName);
          }
        });
      });

      vm.availableServices = availableServices;
    }

    init();
  });

