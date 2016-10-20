/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('ManageEnvironmentSettingsController',
  function ($rootScope, $routeParams, $location, $q, modal, resources, cachedResources, configValidation, cron, Environment) {
    var vm = this;

    vm.environment = {};
    vm.environmentVersion = 0;
    vm.operations = {};
    vm.operationsVersion = 0;
    vm.dataFound = false;
    vm.dataLoading = true;
    vm.owningClustersList = [];
    vm.deploymentMapsList = [];

    vm.environmentValidationNode = {};
    vm.validationModes = [{ Name: 'Validation errors only', Value: false }, { Name: 'All dependencies', Value: true }];
    vm.selectedValidationMode = { Mode: false };

    vm.dependentServices = [];
    vm.dependentLBSettings = [];

    vm.validationTabActive = false;
    vm.scheduleTabActive = false;

    vm.newEnvironment = {
      OwningCluster: '',
      DeploymentMap: '',
      CodeDeployBucket: '',
      Description: '',
    };

    vm.newSchedule = {
      Type: '',
      DefaultSchedule: '',
    };

    function init() {

      var defaultTab = $routeParams['tab'];
      var environmentName = GetActiveEnvironment();
      vm.environment.EnvironmentName = environmentName;

      vm.userHasPermission = user.hasPermission({ access: 'PUT', resource: '/config/environments/' + environmentName });

      if (defaultTab && defaultTab == 'validation') vm.validationTabActive = true;
      if (defaultTab && defaultTab == 'schedule') vm.scheduleTabActive = true;

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = _.map(clusters, 'ClusterName').sort();
        }),

        cachedResources.config.deploymentMaps.all().then(function (deploymentMaps) {
          vm.deploymentMapsList = _.map(deploymentMaps, 'DeploymentMapName');
        }),
      ]).then(function () {
        vm.refresh();
      });
    }

    vm.canUser = function () {
      return vm.userHasPermission;
    };

    vm.refresh = function () {

      vm.dataLoading = true;

      function assignToTheScope(configuration, operations) {

        vm.environment = configuration;
        vm.environmentVersion = configuration.Version;

        vm.operations = operations;
        vm.operationsVersion = operations.Version;

        var scheduleAction = GetScheduleAction(operations.Value);
        vm.operations.getScheduleAction = function () { return scheduleAction; };

        vm.newEnvironment = {
          OwningCluster: configuration.Value.OwningCluster,
          DeploymentMap: configuration.Value.DeploymentMap,
          CodeDeployBucket: configuration.Value.CodeDeployBucket,
          Description: configuration.Value.Description,
        };

        vm.newSchedule = {
          DefaultSchedule: operations.Value.DefaultSchedule,
          Type: operations.Value.ScheduleAutomatically ? 'Automatic' : operations.Value.ManualScheduleUp ? 'On' : 'Off',
        };

      };

      // TODO: only do validation if tab active and on tab change. Will speed up page load a lot
      configValidation.ValidateEnvironmentSetupCache(vm.environment.EnvironmentName).then(function (validationNode) {
        vm.environmentValidationNode = validationNode;
        vm.refreshDependencies();
      }).then(function () {

        $q.all([
          resources.config.environments.get({ key: vm.environment.EnvironmentName }),
          Environment.getSchedule(vm.environment.EnvironmentName),
        ]).then(function (results) {
          var configuration = results[0];
          var operations = results[1];
          assignToTheScope(configuration, operations);

          vm.dataFound = true;
        }, function () {

          vm.dataFound = false;
        }).finally(function () {
          vm.dataLoading = false;
        });

      });
    };

    vm.useSpecificClicked = function () {
      if (!vm.newSchedule.DefaultSchedule || vm.newSchedule.DefaultSchedule.indexOf(':') == -1) {
        vm.newSchedule.DefaultSchedule = 'Start: 0 8 * * 1,2,3,4,5; Stop: 0 19 * * 1,2,3,4,5';
        vm.editing = true;
      }
    };

    vm.nonSpecificClicked = function () {
      vm.editing = false;
    };

    vm.doneClicked = function () {
      vm.editing = false;
      if (vm.newSchedule.DefaultSchedule.indexOf(':') == -1) {
        vm.newSchedule.Type = 'On';
      }
    };

    vm.shouldShowEditor = function () {
      return vm.newSchedule.Type == 'Automatic' && vm.editing == true;
    };

    vm.editClicked = function () {
      vm.editing = true;
    };

    vm.save = function () {

      // Update Environment with form values
      vm.environment.Value.OwningCluster = vm.newEnvironment.OwningCluster;
      vm.environment.Value.DeploymentMap = vm.newEnvironment.DeploymentMap;
      vm.environment.Value.CodeDeployBucket = vm.newEnvironment.CodeDeployBucket;
      vm.environment.Value.Description = vm.newEnvironment.Description;

      var params = {
        key: vm.environment.EnvironmentName,
        expectedVersion: vm.environmentVersion,
        data: vm.environment.Value,
      };
      resources.config.environments.put(params).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Settings Saved',
          message: 'Environment settings saved successfully.',
        }).then(function () {
          vm.refresh();
        });
      });
    };

    vm.applySchedule = function () {

      // Update Environment with form values
      vm.operations.Value.ScheduleAutomatically = vm.newSchedule.Type == 'Automatic';
      vm.operations.Value.ManualScheduleUp = vm.newSchedule.Type == 'On';
      vm.operations.Value.DefaultSchedule = vm.newSchedule.DefaultSchedule;

      var params = {
        key: vm.operations.EnvironmentName,
        expectedVersion: vm.operationsVersion,
        data: {
          Value: vm.operations.Value,
        },
      };
      resources.ops.environments.put(params).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Schedule Updated',
          message: 'Environment schedule saved successfully.<br/><br/>Note: It may take up to 10 minutes for schedule changes to result in servers being turned on or off.',
        }).then(function () {
          vm.refresh();
        });
      });
    };

    vm.delete = function () {
      // TODO: Need proper dialog to clear up resources, uninstall etc. show progress, send alert etc. This just added for basic CRUD support
      var name = vm.environment.EnvironmentName;
      modal.confirmation({
        title: 'Deleting an Environment',
        message: 'Are you sure you want to delete the <strong>' + name + '</strong> Environment?',
        action: 'Delete',
        severity: 'Danger',
        details: ['NOTE: This will not delete any AWS resources associated with this environment or any Load Balancer rules. Clean up of these needs to be done manually.'], // TODO: tool needs to handle all clean up, give options
      }).then(function () {
        resources.config.environments.delete({ key: name }).then(function () {
          cachedResources.config.environments.flush();
          BackToSummary();
        });
      });
    };

    vm.refreshDependencies = function () {
      vm.dependentServices = GetDependentServices();
      vm.dependentLBSettings = GetDependentLBs();
    };

    vm.browseToUpstream = function (upstreamNode) {
      cachedResources.config.lbUpstream.all().then(function (upstreams) {
        var upstream = upstreams.filter(function (up) {
          return up.Value.UpstreamName == upstreamNode.EntityName;
        });

        if (upstream && upstream.length == 1) {
          upstream = upstream[0];
          $location.search('key', encodeURIComponent(upstream.key));
          $location.search('up_environment', upstream.Value.EnvironmentName);
          $location.search('returnPath', encodeURIComponent('/environment/settings/'));
          $location.search('tab', 'validation');
          $location.path('/config/upstream/');
        }
      });
    };

    function GetDependentServices() {
      var nodes = vm.environmentValidationNode.Children;
      var serviceNodes = [];
      if (nodes) {
        var deploymentMap = GetNodes(nodes, 'DeploymentMap', true)[0];
        if (deploymentMap && deploymentMap.Children) {
          serviceNodes = GetNodes(deploymentMap.Children, 'Service', vm.selectedValidationMode.Mode);
        }
      }

      return serviceNodes;
    }

    function GetDependentLBs() {
      var nodes = vm.environmentValidationNode.Children;
      var lbNodes = [];
      if (nodes) {
        lbNodes = GetNodes(nodes, 'LBSetting', vm.selectedValidationMode.Mode);
      }

      return lbNodes;
    }

    function GetNodes(nodes, configType, includeValid) {
      return nodes.filter(function (node) {
        return node.EntityType == configType && (includeValid || node.Valid == false);
      });
    }

    function GetScheduleAction(data) {
      function GetCurrentSchedule() {
        if (data.ScheduleAutomatically === false) {
          if (data.ManualScheduleUp === true) return '247';
          if (data.ManualScheduleUp === false) return 'OFF';
        }

        return data.DefaultSchedule;
      }

      var schedule = GetCurrentSchedule();
      return cron.getActionBySchedule(schedule);
    }

    function GetActiveEnvironment() {
      var environmentName = $routeParams['environment'];
      if (environmentName) {
        // Environment specified on URL, override active environment
        $rootScope.WorkingEnvironment.EnvironmentName = environmentName;
      } else {
        // Nothing specified, read currently active environment and update URL to match
        environmentName = $rootScope.WorkingEnvironment.EnvironmentName;
        $location.search('environment', environmentName);
      }

      return environmentName;
    }

    init();
  });
