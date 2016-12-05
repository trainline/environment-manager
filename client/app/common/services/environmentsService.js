/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('environments',
  function ($q, $http, $rootScope, enums) {
    // Usage examples:
    // resources.environment('<environment-name>').inAWSAccount('<aws-account>').toggleSlices().byService('<service-name>').do(<promise>);
    // resources.environment('<environment-name>').inAWSAccount('<aws-account>').toggleSlices().byUpstream('<upstream-name>').do(<promise>);
    // resources.environment('<environment-name>').inAWSAccount('<aws-account>').deploy({Mode, Service, Version, Slice, PackagePath});

    function defaultFailure(error) {
      $rootScope.$broadcast('error', error);
    };

    function TogglableResource($this) {
      $this.subResourceType = null;
      $this.subResourceValue = null;
      $this.pathname = 'slices/toggle';

      var getUrl = function () {
        var segments = [
          'api',
          $this.awsAccount,
          'environments',
          $this.environmentName,
          $this.subResourceType,
          $this.subResourceValue,
          $this.pathname,
        ];

        var url = segments.join('/');
        return url;
      };

      $this.byService = function (serviceName) {
        $this.subResourceType = 'services';
        $this.subResourceValue = serviceName;
        return $this;
      };

      $this.byUpstream = function (upstreamName) {
        $this.subResourceType = 'upstreams';
        $this.subResourceValue = upstreamName;
        return $this;
      };

      $this.do = function (success, failure) {
        var url = getUrl();
        $http.put(url).then(success, failure || defaultFailure);
      };
    }

    function DeployedNodesQueryResource($this, serviceName) {
      $this.serviceName = serviceName;

      var getUrl = function () {
        return 'api/' + $this.awsAccount + '/environments/' + $this.environmentName + '/services/' + $this.serviceName + '/nodes';
      };

      $this.do = function (success, failure) {
        var url = getUrl();
        return $http.get(url);
      };
    }

    function SliceQueryResource($this, serviceName) {
      $this.serviceName = serviceName;

      var getUrl = function () {
        return 'api/' + $this.awsAccount + '/environments/' + $this.environmentName + '/services/' + $this.serviceName + '/slices';
      };

      $this.do = function (success, failure) {
        var url = getUrl();
        return $http.get(url);
      };
    }

    function EnvironmentResource(environmentName) {
      var $this = this;

      $this.environmentName = environmentName;
      $this.awsAccount = null;

      $this.inAWSAccount = function (awsAccount) {
        $this.awsAccount = awsAccount;
        return $this;
      };

      $this.getSliceInfoForService = function (serviceName) {
        SliceQueryResource($this, serviceName);
        return $this.do();
      };

      $this.getDeployedNodesInfoForService = function (serviceName) {
        DeployedNodesQueryResource($this, serviceName);
        return $this.do();
      };

      $this.toggleSlices = function () {
        TogglableResource($this);
        return $this;
      };

      $this.isProtectedAgainstAction = function(actionName) {
        var url = 'api/environments/' + $this.environmentName + '/protected?action=' + actionName;
        return $http.get(url).then(function(result) {
          return result.data.isProtected;
        })
      }
    };

    return function (environmentName) {
      return new EnvironmentResource(environmentName);
    };
  });
