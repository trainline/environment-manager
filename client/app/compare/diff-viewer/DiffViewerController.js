/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.compare').controller('DiffViewerController',
  function ($scope, $uibModalInstance, resources, cachedResources, $window, $sce, primary, secondary) {
    function init() {
      var jsondiffpatchModule = $window.jsondiffpatch;

      var jsondiffpatch = jsondiffpatchModule.create({
        objectHash: JSON.stringify,
        arrays: {
          detectMove: true,
          includeValueOnMove: false
        }
      });

      var primaryValue = primary ? angular.copy(primary.Value) : undefined;

      if (secondary) {
        var secondaryValue = angular.copy(secondary.Value);
        var delta = jsondiffpatch.diff(primaryValue, secondaryValue);
        var diffValue = jsondiffpatchModule.formatters.html.format(delta, primaryValue);
        $scope.diffValue = $sce.trustAsHtml(diffValue);
      } else {
        $scope.primaryValue = JSON.stringify(primaryValue, null, 2);
      }
    }

    $scope.Ok = function () {
      $uibModalInstance.close();
    };

    init();
  });
