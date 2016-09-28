/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('modal',
  function ($uibModal, $http) {

    // configuration = {
    //    title : 'Window Title',
    //    message : 'Are you sure',
    //    action: 'Action button name',
    //    severity: 'Danger', // Bootstrap class
    //    details: ['This operation cannot be reversed']
    //    infomode: false // true to hide cancel button for info only messages
    // }

    // Class declaration
    function Modal() {};

    // Class static members
    Modal.TemplateHtml = null;
    Modal.ControllerName = 'CommonModalController';

    $http.get('/app/common/common-modal/common-modal.html').then(function (data) {
      Modal.TemplateHtml = data.data;
    });

    // Class instance members
    Modal.prototype.confirmation = function (configuration) {

      var parameters = {
        template: Modal.TemplateHtml,
        controller: Modal.ControllerName,
        resolve: {
          configuration: configuration
        },
      };

      return $uibModal.open(parameters).result;

    };

    Modal.prototype.information = function (configuration) {
      configuration.infomode = true;
      configuration.action = 'OK';

      return Modal.prototype.confirmation(configuration);
    };

    // Service returns an instance of the defined class

    return new Modal();

  });
