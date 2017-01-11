/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').controller('CommonModalController',
  function ($scope, $uibModalInstance, $sce, configuration) {

    var vm = this;

    vm.title = configuration.title;
    vm.message = $sce.trustAsHtml(configuration.message);
    vm.action = configuration.action || 'Ok';
    vm.severity = (configuration.severity || 'Default').toLowerCase();
    vm.details = (configuration.details || []).map($sce.trustAsHtml);
    vm.infoMode = configuration.infomode || false;
    vm.cancelLabel = configuration.cancelLabel || 'Cancel';

    vm.ok = function () {
      $uibModalInstance.close();
    };

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

  });
