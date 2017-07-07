/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage specific LoadBalancer Setting
angular.module('EnvironmentManager.configuration').controller('LBController',
  function ($scope, $routeParams, $location, $q, $http, resources, cachedResources, modal, accountMappingService) {
    $scope.LBSetting = {};
    $scope.LBUpstreamData = [];
    $scope.Version = 0;

    $scope.PageMode = 'Edit'; // Edit, New, Copy
    $scope.DataFound = false;

    $scope.EnvironmentsList = [];
    $scope.ServicesList = [];
    $scope.SettingTypeList = ['Front End', 'Back End'];
    $scope.CopyFromName = '';

    var ReturnPath = '/config/loadbalancers'; // Plus Environment name to get back to the previous selection

    var configStructure = {
      SchemaVersion: 1,
      EnvironmentName: '',
      VHostName: '',
      Listen: [
        { IP: '', Port: '', SSL: true }
      ],
      SSLCertificate: '',
      SSLKey: '',
      ServerName: [''],
      FrontEnd: false,
      TokeniseLocations: false,
      Locations: [{
        Path: '',
        ServiceName: '',
        IfCondition: '',
        IfConditionPriority: 1,
        Tokenise: false,
        ProxySetHeaders: [''],
        ProxyPass: '',
        Healthcheck: {
          Interval: 0,
          Fails: 0,
          Passes: 0,
          URI: ''
        },
        ProxyHttpVersion: '',
        AddHeaders: [''],
        ReturnCode: 0,
        ReturnURI: '',
        MoreHeaders: ['header:value'],
        RewriteCondition: '',
        RewriteURI: '',
        RewriteState: ''
      },]
    };

    var DefaultValue = JSON.stringify(configStructure, null, 4);

    function init() {
      var mode = $routeParams.mode;
      var environment = $routeParams.lb_environment;
      var range = $routeParams.range;

      resources.config.lbUpstream.all({ account: 'all' }).then(function (upstreams) {
        $scope.LBUpstreamData = upstreams; // Used to validate upstreams exist
      });

      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          $scope.EnvironmentsList = _.map(environments, 'EnvironmentName').sort();
        }),

        cachedResources.config.services.all().then(function (services) {
          $scope.ServicesList = _.map(services, 'ServiceName');
        })
      ]).then(function () {
        $scope.PageMode = mode ? mode : 'Edit';
        if ($scope.PageMode == 'Edit' || $scope.PageMode == 'Copy') {
          accountMappingService.getAccountForEnvironment(environment).then(function (accountName) {
            var params = {
              account: accountName,
              key: environment,
              range: range
            };
            resources.config.lbSettings.get(params).then(function (data) {
              if ($scope.PageMode == 'Copy') {
                $scope.CopyFromName = data.VHostName;
                data.VHostName = '';
                data.Value.VHostName = '';
              }

              $scope.LBSetting = data;
              $scope.LBSetting.Value = JSON.stringify(data.Value, null, 4);
              $scope.Version = data.Version;
              $scope.DataFound = true;
              if ($scope.PageMode == 'Edit') {
                $scope.userHasPermission = user.hasPermission({ access: 'PUT', resource: '/' + accountName + '/config/lbsettings/' + environment + '/' + range });
              } else {
                $scope.userHasPermission = user.hasPermission({ access: 'POST', resource: '/*/config/lbsettings/**' });
              }
            });
          });
        } else { // Mode == New
          $scope.LBSetting.EnvironmentName = environment;
          $scope.LBSetting.Value = DefaultValue;
          $scope.userHasPermission = user.hasPermission({ access: 'POST', resource: '/*/config/lbsettings/**' });
        }
      });
    }

    $scope.canUser = function () {
      return $scope.userHasPermission;
    };

    $scope.Save = function () {
      accountMappingService.getAccountForEnvironment($scope.LBSetting.EnvironmentName).then(function (accountName) {
        var key = $scope.LBSetting.EnvironmentName;
        var range = $scope.LBSetting.VHostName;
        var value = JSON.parse($scope.LBSetting.Value);

        var promise;
        if ($scope.PageMode == 'Edit') {
          promise = $http({
            method: 'put',
            url: '/api/v1/config/lb-settings/' + key + '/' + range,
            data: value,
            headers: { 'expected-version': $scope.Version }
          });
        } else {
          promise = $http({
            method: 'post',
            url: '/api/v1/config/lb-settings',
            data: {
              EnvironmentName: $scope.LBSetting.EnvironmentName,
              VHostName: $scope.LBSetting.VHostName,
              Value: value
            },
            headers: { 'expected-version': $scope.Version }
          });
        }

        promise.then(function () {
          cachedResources.config.lbSettings.flush();
          BackToSummary($scope.LBSetting.EnvironmentName);
        });
      });
    };

    $scope.Cancel = function () {
      BackToSummary($routeParams.lb_environment); // Go back to original environment selection
    };

    $scope.ValidateJson = function (value) {
      var errors = [];

      // Validate syntax structure and mandatory attributes
      var mandatoryFields = ['SchemaVersion', 'EnvironmentName', 'VHostName', 'Listen', 'ServerName', 'FrontEnd', 'Locations'];
      var optionalFields = ['Set', 'ProxySetHeaders', 'AddHeaders', 'SSLCertificate', 'SSLKey', 'GreenPort', 'InstallCheckURL', 'UninstallScriptPath', 'SiteInMaintenance', 'RedirectToLower', 'TokeniseLocations'];
      var errors = $scope.ValidateFields(value, mandatoryFields, optionalFields);

      // Validate Listen
      if (value.Listen) {
        var listenErrors = $scope.ValidateArrayField(value.Listen, 'Listen', true);
        errors = errors.concat(listenErrors);

        if (listenErrors.length == 0) {
          var listenMandatoryFields = ['Port'];
          var listenOptionalFields = ['IP', 'SSL'];
          for (var i = 0; i < value.Listen.length; i++) {
            errors = errors.concat($scope.ValidateFields(value.Listen[i], listenMandatoryFields, listenOptionalFields, 'Listen[' + i + ']'));
          }
        }
      }

      // Validate Server Name
      if (value.ServerName) {
        errors = errors.concat($scope.ValidateArrayField(value.ServerName, 'ServerName', true));
      }

      // Validate Set
      if (value.Set) {
        errors = errors.concat($scope.ValidateArrayField(value.Set, 'Set', true));
      }

      // Validate ProxySetHeaders
      if (value.ProxySetHeaders) {
        errors = errors.concat($scope.ValidateArrayField(value.ProxySetHeaders, 'ProxySetHeaders', true));
      }

      // Validate AddHeaders
      if (value.AddHeaders) {
        errors = errors.concat($scope.ValidateArrayField(value.AddHeaders, 'AddHeaders', true));
      }

      // Validate Locations
      if (value.Locations) {
        var locationErrors = $scope.ValidateArrayField(value.Locations, 'Locations', true);
        errors = errors.concat(locationErrors);

        if (locationErrors.length == 0) {
          var locationMandatoryFields = ['Path'];
          var locationOptionalFields = ['Set', 'TryFiles', 'Rewrites', 'ServiceName', 'IfCondition', 'IfConditionPriority', 'Tokenise', 'ProxySetHeaders', 'ProxyPass', 'HealthCheck', 'ProxyHttpVersion', 'AddHeaders', 'ReturnCode', 'ReturnURI', 'MoreHeaders', 'RewriteCondition', 'RewriteURI', 'RewriteState', 'frompolicy', 'Priority', 'RawNginxConfig'];
          var healthCheckMandatoryFields = [];
          var healthCheckOptionalFields = ['Interval', 'Passes', 'Fails', 'URI'];
          var rewriteMandatoryFields = ['Condition', 'URI', 'State'];
          var rewriteOptionalFields = [];
          for (var i = 0; i < value.Locations.length; i++) {
            var location = value.Locations[i];

            // Check structure
            errors = errors.concat($scope.ValidateFields(location, locationMandatoryFields, locationOptionalFields, 'Locations[' + i + ']'));

            // Validate health check
            if (location.HealthCheck) {
              errors = errors.concat($scope.ValidateFields(location.HealthCheck, healthCheckMandatoryFields, healthCheckOptionalFields, 'Locations[' + i + ']/HealthCheck'));
            }

            // Validate arrays
            if (location.ProxySetHeaders) {
              errors = errors.concat($scope.ValidateArrayField(location.ProxySetHeaders, 'ProxySetHeaders', false, 'Locations[' + i + ']'));
            }

            if (location.MoreHeaders) {
              errors = errors.concat($scope.ValidateArrayField(location.MoreHeaders, 'MoreHeaders', false, 'Locations[' + i + ']'));
            }

            if (location.AddHeaders) {
              errors = errors.concat($scope.ValidateArrayField(location.AddHeaders, 'AddHeaders', false, 'Locations[' + i + ']'));
            }

            if (location.Set) {
              errors = errors.concat($scope.ValidateArrayField(location.Set, 'Set', false, 'Locations[' + i + ']'));
            }

            // Check service name exists if specified
            if (location.ServiceName) {
              if ($scope.ServicesList.indexOf(location.ServiceName) == -1) {
                errors.push('Locations[' + i + '] - Service Name not recognised. Please check spelling and capitalisation');
              }
            }

            // Validate rewrites
            if (location.Rewrites) {
              errors = errors.concat($scope.ValidateFields(location.Rewrites, rewriteMandatoryFields, rewriteOptionalFields, 'Locations[' + i + ']/Rewrites'));
            }

            if (location.ProxyPass) {
              var matchResults = location.ProxyPass.match(/^https?:\/\/([^$]+)/);

              if (!matchResults) {
                errors.push('Locations[' + i + '] - ProxyPass address is not valid. Check it begins with "http://" or "https://".');
              } else {
                var proxyUpstreamName = matchResults[1];

                // Validate Upstream exists
                if (!_.includes(proxyUpstreamName, '.')) {
                  if ($scope.LBUpstreamData && $scope.LBUpstreamData.length > 0) {
                    var matchFound = $scope.LBUpstreamData.some(function upstreamIsProxy(upstream) {
                      return upstream.Value.UpstreamName === proxyUpstreamName;
                    });

                    if (!matchFound) {
                      errors.push('Locations[' + i + '] - Upstream name in Proxy Pass not found. Please check spelling and capitalisation');
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Semantic validations only if structure OK
      if (errors.length > 0) return errors;

      // Environment name in Value must match Environment selected
      if ($scope.LBSetting.EnvironmentName != value.EnvironmentName) {
        errors.push('EnvironmentName in JSON value must match the selected Environment');
      }

      // VHostName must match
      if ($scope.LBSetting.VHostName != value.VHostName) {
        errors.push('VHostName in JSON value must match the specified Virtual Host Name');
      }

      return (errors.length > 0) ? errors : null;
    };

    function BackToSummary(environment) {
      $location.search('lb_environment', environment);
      $location.path(ReturnPath);
    }

    $scope.$watch('LBSetting.EnvironmentName', function (newVal, oldVal) {
      // Keep JSON in sync with selected environment
      if ($scope.LBSetting && $scope.LBSetting.Value) {
        var clone = JSON.parse($scope.LBSetting.Value);
        clone.EnvironmentName = newVal;
        $scope.LBSetting.Value = JSON.stringify(clone, null, 4);
      }
    });
    init();
  });

