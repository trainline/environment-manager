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
    
    return {
      confirmation: function (configuration) {
        var parameters = {
          templateUrl: '/app/common/common-modal/common-modal.html',
          controller: 'CommonModalController as vm',
          resolve: {
            configuration: configuration
          },
        };

        return $uibModal.open(parameters).result;
      },
      
      information: function (configuration) {
        configuration.infomode = true;
        configuration.action = 'OK';

        return this.confirmation(configuration);
      }
    };
  });
