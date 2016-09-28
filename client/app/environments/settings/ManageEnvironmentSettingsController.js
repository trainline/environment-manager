/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('ManageEnvironmentSettingsController',
  function ($rootScope, $scope, $routeParams, $location, $q, modal, resources, cachedResources, configValidation, cron) {

    $scope.Environment = {};
    $scope.EnvironmentVersion = 0;
    $scope.Operations = {};
    $scope.OperationsVersion = 0;
    $scope.DataFound = false;
    $scope.DataLoading = true;
    $scope.OwningClustersList = [];
    $scope.DeploymentMapsList = [];

    $scope.EnvironmentValidationNode = {};
    $scope.ValidationModes = [{ Name: 'Validation errors only', Value: false }, { Name: 'All dependencies', Value: true }];
    $scope.SelectedValidationMode = { Mode: false };

    $scope.DependentServices = [];
    $scope.DependentLBSettings = [];

    $scope.ValidationTabActive = false;
    $scope.ScheduleTabActive = false;

    $scope.NewEnvironment = {
      OwningCluster: '',
      DeploymentMap: '',
      CodeDeployBucket: '',
      Description: '',
    };

    $scope.NewSchedule = {
      Type: '',
      DefaultSchedule: '',
    };

    function init() {

      var defaultTab = $routeParams['tab'];
      var environmentName = GetActiveEnvironment();
      $scope.Environment.EnvironmentName = environmentName;

      $scope.userHasPermission = user.hasPermission({ access: 'PUT', resource: '/config/environments/' + environmentName });

      if (defaultTab && defaultTab == 'validation') $scope.ValidationTabActive = true;
      if (defaultTab && defaultTab == 'schedule') $scope.ScheduleTabActive = true;

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          $scope.OwningClustersList = _.map(clusters, 'ClusterName').sort();
        }),

        cachedResources.config.deploymentMaps.all().then(function (deploymentMaps) {
          $scope.DeploymentMapsList = _.map(deploymentMaps, 'DeploymentMapName');
        }),
      ]).then(function () {
        $scope.Refresh();
      });
    }

    $scope.canUser = function () {
      return $scope.userHasPermission;
    };

    $scope.Refresh = function () {

      $scope.DataLoading = true;

      function assignToTheScope(configuration, operations) {

        $scope.Environment = configuration;
        $scope.EnvironmentVersion = configuration.Version;

        $scope.Operations = operations;
        $scope.OperationsVersion = operations.Version;

        var scheduleAction = GetScheduleAction(operations.Value);
        $scope.Operations.getScheduleAction = function () {
          return scheduleAction; };

        $scope.NewEnvironment = {
          OwningCluster: configuration.Value.OwningCluster,
          DeploymentMap: configuration.Value.DeploymentMap,
          CodeDeployBucket: configuration.Value.CodeDeployBucket,
          Description: configuration.Value.Description,
        };

        $scope.NewSchedule = {
          DefaultSchedule: operations.Value.DefaultSchedule,
          Type: operations.Value.ScheduleAutomatically ? 'Automatic' : operations.Value.ManualScheduleUp ? 'On' : 'Off',
        };

      };

      // TODO: only do validation if tab active and on tab change. Will speed up page load a lot
      configValidation.ValidateEnvironmentSetupCache($scope.Environment.EnvironmentName).then(function (validationNode) {
        $scope.EnvironmentValidationNode = validationNode;
        $scope.RefreshDependencies();
      }).then(function () {

        $q.all([
          resources.config.environments.get({ key: $scope.Environment.EnvironmentName }),
          resources.ops.environments.get({ key: $scope.Environment.EnvironmentName }),
        ]).then(function (results) {
          var configuration = results[0];
          var operations = results[1];
          assignToTheScope(configuration, operations);

          $scope.DataFound = true;
        }, function () {

          $scope.DataFound = false;
        }).finally(function () {
          $scope.DataLoading = false;
        });

      });
    };

    $scope.UseSpecificClicked = function () {
      if (!$scope.NewSchedule.DefaultSchedule || $scope.NewSchedule.DefaultSchedule.indexOf(':') == -1) {
        $scope.NewSchedule.DefaultSchedule = 'Start: 0 8 * * 1,2,3,4,5; Stop: 0 19 * * 1,2,3,4,5';
        $scope.editing = true;
      }
    };

    $scope.NonSpecificClicked = function () {
      $scope.editing = false;
    };

    $scope.DoneClicked = function () {
      $scope.editing = false;
      if ($scope.NewSchedule.DefaultSchedule.indexOf(':') == -1) {
        $scope.NewSchedule.Type = 'On';
      }
    };

    $scope.ShouldShowEditor = function () {
      return $scope.NewSchedule.Type == 'Automatic' && $scope.editing == true;
    };

    $scope.EditClicked = function () {
      $scope.editing = true;
    };

    $scope.Save = function () {

      // Update Environment with form values
      $scope.Environment.Value.OwningCluster = $scope.NewEnvironment.OwningCluster;
      $scope.Environment.Value.DeploymentMap = $scope.NewEnvironment.DeploymentMap;
      $scope.Environment.Value.CodeDeployBucket = $scope.NewEnvironment.CodeDeployBucket;
      $scope.Environment.Value.Description = $scope.NewEnvironment.Description;

      var params = {
        key: $scope.Environment.EnvironmentName,
        expectedVersion: $scope.EnvironmentVersion,
        data: {
          Value: $scope.Environment.Value,
        },
      };
      resources.config.environments.put(params).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Settings Saved',
          message: 'Environment settings saved successfully.',
        }).then(function () {
          $scope.Refresh();
        });
      });
    };

    $scope.ApplySchedule = function () {

      // Update Environment with form values
      $scope.Operations.Value.ScheduleAutomatically = $scope.NewSchedule.Type == 'Automatic';
      $scope.Operations.Value.ManualScheduleUp = $scope.NewSchedule.Type == 'On';
      $scope.Operations.Value.DefaultSchedule = $scope.NewSchedule.DefaultSchedule;

      var params = {
        key: $scope.Operations.EnvironmentName,
        expectedVersion: $scope.OperationsVersion,
        data: {
          Value: $scope.Operations.Value,
        },
      };
      resources.ops.environments.put(params).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Schedule Updated',
          message: 'Environment schedule saved successfully.<br/><br/>Note: It may take up to 10 minutes for schedule changes to result in servers being turned on or off.',
        }).then(function () {
          $scope.Refresh();
        });
      });
    };

    $scope.Delete = function () {
      // TODO: Need proper dialog to clear up resources, uninstall etc. show progress, send alert etc. This just added for basic CRUD support
      var name = $scope.Environment.EnvironmentName;
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

    $scope.RefreshDependencies = function () {
      $scope.DependentServices = GetDependentServices();
      $scope.DependentLBSettings = GetDependentLBs();
    };

    $scope.BrowseToUpstream = function (upstreamNode) {
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
      var nodes = $scope.EnvironmentValidationNode.Children;
      var serviceNodes = [];
      if (nodes) {
        var deploymentMap = GetNodes(nodes, 'DeploymentMap', true)[0];
        if (deploymentMap && deploymentMap.Children) {
          serviceNodes = GetNodes(deploymentMap.Children, 'Service', $scope.SelectedValidationMode.Mode);
        }
      }

      return serviceNodes;
    }

    function GetDependentLBs() {
      var nodes = $scope.EnvironmentValidationNode.Children;
      var lbNodes = [];
      if (nodes) {
        lbNodes = GetNodes(nodes, 'LBSetting', $scope.SelectedValidationMode.Mode);
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
