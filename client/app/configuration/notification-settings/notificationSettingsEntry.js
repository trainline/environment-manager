/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
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
          promise = $http({
            method: 'put',
            url: '/api/v1/config/notification-settings/' + vm.model.NotificationSettingsId,
            headers: { 'expected-version': vm.model.Version },
            data: vm.model.Value
          });
        } else {
          promise = $http.post('/api/v1/config/notification-settings', vm.model);
        }

        promise.then(function() {
          $location.path('/config/notification-settings');
        });
      }

      function loadNotificationSettings() {
        $http.get('/api/v1/config/notification-settings/' + vm.routeId)
          .then(function (response) {
            vm.model = response.data;
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
            Version: 0,
            Value: {}
          }
        }
      }

      init();
    }
  });
