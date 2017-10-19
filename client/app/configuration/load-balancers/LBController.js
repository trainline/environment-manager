/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage specific LoadBalancer Setting
angular.module('EnvironmentManager.configuration').controller('LBController',
  function ($scope, $routeParams, $location, $q, $http, resources, cachedResources, modal, accountMappingService, schemaValidatorService) {
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
        { Port: '' }
      ],
      ServerName: [''],
      FrontEnd: false,
      Locations: [{
        Path: '',
        Priority: 1,
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
        RewriteState: '',
        Rewrites: {
          Condition: '',
          URI: '',
          State: ''
        },
        RawNginxConfig: '',
        Set: '',
        TryFiles: '',
        CustomErrorCodes: ["all"],
        CacheTime: ''
      }]
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
      var validator = schemaValidatorService('LBSettings');
      var jsonValid = validator(value);
      if (!jsonValid) {
        console.log('running custom rules')
        var result = $scope.CustomRules(value);
        console.log(result)
        return result;
      }
      else return jsonValid;
    };

    $scope.CustomRules = function (value) {
      console.log('start custom rules')
      var rules = [
        upstreamExists
      ];
      console.log('custom rules defined')

      var results = rules.map(function (r) {
        console.log('running rule')
        var result = r(value);
        console.log('result: ', result);
        return result;
      })
        .filter(function (r) {
          return r.length > 0;
        });

      console.log('done in custom rules')
      console.log(results)

      return results.length > 0 ? results : null;
    }

    function upstreamExists(value) {
      var errors = [];
      console.log(1)
      if (value.Locations) {
        console.log(2)
        value.Locations.forEach(function (location) {
          console.log(3)
          if (location.ProxyPass) {
            console.log(4)
            var matchResults = location.ProxyPass.match(/^https?:\/\/([^$]+)/);
            if (!matchResults) {
              console.log(5)
              errors.push('Locations[' + i + '] - ProxyPass address is not valid. Check it begins with "http://" or "https://".');
            } else {
              console.log(6)
              var proxyUpstreamName = matchResults[1];
              // Validate Upstream exists
              if (!_.includes(proxyUpstreamName, '.')) {
                console.log(7)
                if ($scope.LBUpstreamData && $scope.LBUpstreamData.length > 0) {
                  console.log(8)
                  var matchFound = $scope.LBUpstreamData.some(function upstreamIsProxy(upstream) {
                    return upstream.Value.UpstreamName === proxyUpstreamName;
                  });
                  if (!matchFound) {
                    console.log(9)
                    errors.push('Locations[' + i + '] - Upstream name in Proxy Pass not found. Please check spelling and capitalisation');
                  }
                }
              }
            }
          }
        });
      }
      console.log('complete')
      console.log(errors)
      return errors;
    }

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

