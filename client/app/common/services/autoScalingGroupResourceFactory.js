/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// TODO(filip): get rid of all these builders
angular.module('EnvironmentManager.common').factory('autoScalingGroupResourceFactory',
  function ($q, $http, $rootScope) {

    // Usage examples:
    // resources.aws.asgs.all().do().then(<promise>);
    // resources.aws.asgs.all().inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.get('<auto-scaling-group-name>').inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.get('<auto-scaling-group-name>').size().inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.get('<auto-scaling-group-name>').launchConfiguration().inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.set('<auto-scaling-group-name>').minSize(2).desiredSize(2).maxSize(2).inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.set('<auto-scaling-group-name>').imageId('ami-xxxxxx').inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.set('<auto-scaling-group-name>').instanceType('m3.medium').inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.set('<auto-scaling-group-name>').schedule('schedule-value', options).inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.enter('<auto-scaling-group-name>').instances([<instance-id>]).toStandby().inAWSAccount('Sandbox').do().then(<promise>);
    // resources.aws.asgs.exit('<auto-scaling-group-name>').instances([<instance-id>]).fromStandby().inAWSAccount('Sandbox').do().then(<promise>);

    function AutoScalingGroupRequest(httpMethod) {

      var $this = this;

      var $data = {
        httpMethod: httpMethod,
        awsAccountName: 'all',
        autoScalingGroupName: null,
        action: null,
        request: {},
      };

      function promisify(delegate) {

        var deferred = $q.defer();

        delegate.then(function (data) {
          deferred.resolve(data ? data.data : null);
        }, function (error) {

          $rootScope.$broadcast('error', error);
          deferred.reject(error);
        });

        return deferred.promise;
      }

      $this.setAWSAccount = function (awsAccountName) {
        $data.awsAccountName = awsAccountName;
      };

      $this.setAutoScalingGroupName = function (autoScalingGroupName) {
        $data.autoScalingGroupName = autoScalingGroupName;
      };

      $this.setAction = function (action) {
        $data.action = action;
      };

      $this.setRequest = function (request) {
        for (var field in request) {
          $data.request[field] = request[field];
        }
      };

      $this.getUrl = function () {
        var segments = ['api', $data.awsAccountName, 'asgs'];

        if ($data.autoScalingGroupName) {
          segments.push($data.autoScalingGroupName);
          segments.push($data.action);
        }

        return segments.join('/');
      };

      $this.do = function () {

        var url = $this.getUrl();
        var delegate = $data.httpMethod === 'PUT' ? $http.put(url, $data.request) : $http.get(url);

        return promisify(delegate);
      };
    }

    function AutoScalingGroupAllAction() {

      var $this = this;
      var $data = new AutoScalingGroupRequest('GET');

      $this.inAWSAccount = function (awsAccountName) {
        if (!awsAccountName) throw new Error('Invalid "awsAccountName" argument');
        $data.setAWSAccount(awsAccountName);
        return $this;
      };

      $this.do = function () {
        return $data.do();
      };
    }

    function AutoScalingGroupGetAction(autoScalingGroupName) {

      if (!autoScalingGroupName) throw new Error('AutoScalingGroup name cannot be null or empty');

      var $this = this;
      var $data = new AutoScalingGroupRequest('GET');

      $data.setAutoScalingGroupName(autoScalingGroupName);

      $this.inAWSAccount = function (awsAccountName) {
        if (!awsAccountName) throw new Error('Invalid "awsAccountName" argument');
        $data.setAWSAccount(awsAccountName);
        return $this;
      };

      // TODO(filip): this is SOOOO CONFUSING. Kill all the chain builders!!!
      $this.launchConfiguration = function () {
        $data.setAction('launchconfig');
        return $this;
      };

      $this.size = function () {
        $data.setAction('size');
        return $this;
      };

      $this.do = function () {
        return $data.do();
      };
    }

    function AutoScalingGroupSetAction(autoScalingGroupName) {

      if (!autoScalingGroupName) throw new Error('AutoScalingGroup name cannot be null or empty');

      var $this = this;
      var $data = new AutoScalingGroupRequest('PUT');

      $data.setAutoScalingGroupName(autoScalingGroupName);

      $this.inAWSAccount = function (awsAccountName) {
        if (!awsAccountName) throw new Error('Invalid "awsAccountName" argument');
        $data.setAWSAccount(awsAccountName);
        return $this;
      };

      $this.minSize = function (size) {
        if (!size) size = 0;
        $data.setAction('size');
        $data.setRequest({ min: size });
        return $this;
      };

      $this.maxSize = function (size) {
        if (!size) size = 0;
        $data.setAction('size');
        $data.setRequest({ max: size });
        return $this;
      };

      $this.desiredSize = function (size) {
        if (!size) size = 0;
        $data.setAction('size');
        $data.setRequest({ desired: size });
        return $this;
      };

      $this.imageId = function (imageId) {
        if (!imageId) throw new Error('Invalid "imageId" argument');
        $data.setAction('launchconfig/imageId');
        $data.setRequest({ imageId: imageId });
        return $this;
      };

      $this.instanceType = function (instanceType) {
        if (!instanceType) throw new Error('Invalid "instanceType" argument');
        $data.setAction('launchconfig/instanceType');
        $data.setRequest({ instanceType: instanceType });
        return $this;
      };

      $this.schedule = function (schedule, options) {
        $data.setAction('schedule');
        $data.setRequest({ schedule: schedule });
        $data.setRequest(options);
        return $this;
      };

      $this.do = function () {
        return $data.do();
      };
    }

    function AutoScalingGroupEnterAction(autoScalingGroupName) {

      if (!autoScalingGroupName) throw new Error('AutoScalingGroup name cannot be null or empty');

      var $this = this;
      var $data = new AutoScalingGroupRequest('PUT');

      $data.setAutoScalingGroupName(autoScalingGroupName);

      $this.inAWSAccount = function (awsAccountName) {
        if (!awsAccountName) throw new Error('Invalid "awsAccountName" argument');
        $data.setAWSAccount(awsAccountName);
        return $this;
      };

      $this.instances = function (instanceIds) {
        if (!instanceIds || !instanceIds.length) throw new Error('Argument cannot be null or empty. Expected list of Instance IDs.');
        $data.setRequest({ instanceIds: instanceIds });
        return $this;
      };

      $this.toStandby = function () {
        $data.setAction('enterToStandby');
        return $this;
      };

      $this.do = function () {
        return $data.do();
      };
    }

    function AutoScalingGroupExitAction(autoScalingGroupName) {

      if (!autoScalingGroupName) throw new Error('AutoScalingGroup name cannot be null or empty');

      var $this = this;
      var $data = new AutoScalingGroupRequest('PUT');

      $data.setAutoScalingGroupName(autoScalingGroupName);

      $this.inAWSAccount = function (awsAccountName) {
        if (!awsAccountName) throw new Error('Invalid "awsAccountName" argument');
        $data.setAWSAccount(awsAccountName);
        return $this;
      };

      $this.instances = function (instanceIds) {
        if (!instanceIds || !instanceIds.length) throw new Error('Argument cannot be null or empty. Expected list of Instance IDs.');
        $data.setRequest({ instanceIds: instanceIds });
        return $this;
      };

      $this.fromStandby = function () {
        $data.setAction('exitFromStandby');
        return $this;
      };

      $this.do = function () {
        return $data.do();
      };
    }

    return {
      name: 'asgs',

      getLaunchConfig: function (account, name) {
        var segments = ['api', account, 'asgs', name, 'launchconfig'];
        var url = segments.join('/');
        return $http.get(url).then(function (response) {
          return response.data;
        });
      },

      getScalingSchedule: function (account, name) {
        var segments = ['api', account, 'asgs', name, 'scaling-schedule'];
        var url = segments.join('/');
        return $http.get(url).then(function (response) {
          return response.data;
        });
      },

      updateLaunchConfig: function(account, name, data) {
        var segments = ['api', account, 'asgs', name, 'launchconfig'];
        var url = segments.join('/');
        return $http.post(url, data).then(function (response) {
          return response.data;
        });
      },

      all: function () {
        return new AutoScalingGroupAllAction();
      },

      // TODO(filip): remove chain builder pattern
      get: function (autoScalingGroupName) {
        return new AutoScalingGroupGetAction(autoScalingGroupName);
      },

      set: function (autoScalingGroupName) {
        return new AutoScalingGroupSetAction(autoScalingGroupName);
      },

      enter: function (autoScalingGroupName) {
        return new AutoScalingGroupEnterAction(autoScalingGroupName);
      },

      exit: function (autoScalingGroupName) {
        return new AutoScalingGroupExitAction(autoScalingGroupName);
      },
    };
  });
