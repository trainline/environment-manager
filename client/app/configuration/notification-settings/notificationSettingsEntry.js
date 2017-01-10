/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .component('notificationSettingsEntry', {
    templateUrl: '/app/configuration/notification-settings/notificationSettingsEntry.html',
    controllerAs: 'vm',
    controller: function ($routeParams, $location, $http) {
      var vm = this;

      vm.save = function () {

        var promise;
        if (vm.isBeingEdited === true) {
          promise = $http.put('/api/v1/config/notification-settings/' + notificationSettingsId, value);
        } else {
          promise = $http.post('/api/v1/config/notification-settings', vm.model);
        }

        promise.then(function() {
          $location.path('/config/notification-settings');
        });
      }

      function loadNotificationSettings() {
        $http.get('/api/v1/config/notification-settings/' + vm.routeId)
          .then(function (model) {
            vm.model = model;
          }, function () {
            vm.loadFailed = true;
          });
      }

      function init() {
        vm.routeId = $routeParams['id'];
        vm.isBeingEdited = vm.routeId !== 'add';

        if (vm.isBeingEdited === true) {
          loadNotificationSettings();
        } else {
          vm.model = {
            NotificationSettingsId: '',
            Value: {
              
            }
          }
        }
      }

      init();
    }
  });