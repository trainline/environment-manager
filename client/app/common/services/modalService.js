/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

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

    function getParameters(configuration) {
      return {
        templateUrl: '/app/common/common-modal/common-modal.html',
        controller: 'CommonModalController as vm',
        resolve: {
          configuration: configuration
        }
      };
    }

    return {
      confirmation: function (configuration) {
        return $uibModal.open(getParameters(configuration)).result;
      },

      error: function (title, errorMessage) {
        return this.information({
          title: title,
          message: errorMessage,
          severity: 'Danger'
        });
      },

      information: function (configuration) {
        configuration.infomode = true;
        configuration.action = 'OK';

        return this.confirmation(configuration);
      }
    };
  });

