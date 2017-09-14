/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .component('notificationSettingsList', {
    templateUrl: '/app/configuration/notification-settings/notificationSettingsList.html',
    controllerAs: 'vm',
    controller: function ($scope, $http, $location, modal) {
      var vm = this;

      vm.canPost = user.hasPermission({ access: 'POST', resource: '/config/notification-settings' });
      vm.canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/notification-settings/*' });

      vm.searchNotifications;

      function refresh() {
        $http.get('/api/v1/config/notification-settings').then(function (response) {
          vm.data = response.data;
        });
      }

      vm.addNewNotification = function () {
        $location.path( '/config/notification-settings/add' );
      };

      vm.delete = function (entry) {
        var id = entry.NotificationSettingsId;
        var expectedVersion = entry.Version;
        modal.confirmation({
          title: 'Delete Notification Settings',
          message: 'Are you sure you want to delete the <strong>' + id + '</strong> notification settings?',
          action: 'Delete',
          severity: 'Danger',
        }).then(function () {
          var req = {
            method: 'DELETE',
            url: '/api/v1/config/notification-settings/' + id,
            headers: {
              'expected-version': expectedVersion
            }
          };
          $http(req).then(refresh);
        });
      };

      vm.viewHistory = function (entry) {
        $scope.ViewAuditHistory('NotificationSettings', entry.NotificationSettingsId);
      };

      refresh();
    }
  });
