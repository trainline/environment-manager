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
      var schemaErrors = validator(value);
      if (schemaErrors === null) {
        try {
          var result = $scope.CustomRules(value);
          if (result.length > 0) return result[0];
          else return null;
        } catch (e) { return null; }
      } else return schemaErrors;
    };

    $scope.CustomRules = function (value) {
      var rules = [
        upstreamExists
      ];

      var results = rules.map(function (r) {
        return r(value);
      })
        .filter(function (r) {
          return r.length > 0;
        });

      return results.length > 0 ? results : null;
    }

    function upstreamExists(value) {
      var errors = [];
      if (value.Locations) {
        value.Locations.forEach(function (location, i) {
          if (location.ProxyPass) {
            if (!checkProxyPassAgainstSetKeys(location)) {
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
        });
      }
      return errors;
    }

    function checkProxyPassAgainstSetKeys(location) {
      var matchingValueInSet = false;
      
      function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      }
      
      if (location.Set && location.ProxyPass) {
        matchingValueInSet = location.Set.some(function (set) {
          var setParts = set.split(' ');
          var key = setParts[0];
          var check = new RegExp('^https?:\/\/(' + escapeRegExp(key) + ')$');
          var result = location.ProxyPass.match(check);

          if (result) return true;
          else return false;
        });
        console.log("Matching Value In Set", matchingValueInSet)
      }

      return matchingValueInSet;
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

