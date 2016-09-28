/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// Manage specific owning cluster
angular.module('EnvironmentManager.configuration').controller('ClusterController',
  function ($scope, $routeParams, $location, $q, resources, cachedResources) {

    var RETURN_PATH = '/config/clusters';
    var userHasPermission;

    $scope.Cluster = {};
    $scope.EditMode = false;
    $scope.DataFound = false;
    $scope.ClusterNames = [];
    $scope.Version = 0;

    var configStructure = {
      SchemaVersion: 1,
      ShortName: '',
      ADMembershipGroup: '',
      GroupEmailAddress: '',
    };

    $scope.DefaultValue = configStructure;
    $scope.Cancel = navigateToList;

    function init() {

      var cluster = $routeParams['cluster'];
      $scope.EditMode = !(cluster.toLowerCase() == 'new');

      var access = $scope.EditMode ? 'PUT' : 'POST';
      var resource = $scope.EditMode ? cluster : '*';
      userHasPermission = user.hasPermission({ access: access, resource: '/config/clusters/' + resource });

      $q.all([
        resources.config.clusters.all().then(function (clusters) {
          $scope.ClusterNames = _.map(clusters, 'ClusterName');
        }),
      ]).then(function () {
        if ($scope.EditMode) readItem(cluster);
        $scope.Cluster.Value = $scope.DefaultValue;
      });
    };

    $scope.canUser = function () {
      return userHasPermission;
    };

    $scope.Save = function () {
      var saveMethod = $scope.EditMode ? resources.config.clusters.put : resources.config.clusters.post;
      var params = {
        key: $scope.Cluster.ClusterName,
        expectedVersion: $scope.Version,
        data: {
          Value: $scope.Cluster.Value,
        },
      };
      saveMethod(params).then(function () {
        cachedResources.config.clusters.flush();
        navigateToList();
      });
    };

    function navigateToList() {
      $location.path(RETURN_PATH);
    }

    function readItem(name) {
      resources.config.clusters.get({ key: name }).then(function (data) {
        $scope.DataFound = true;
        $scope.Cluster = data;
        $scope.Cluster.Value = data.Value;
        $scope.Version = data.Version;
      }, function () {

        $scope.DataFound = false;
      });
    }

    init();
  });