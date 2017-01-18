/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .component('notificationSettingsList', {
    templateUrl: '/app/configuration/notification-settings/notificationSettingsList.html',
    controllerAs: 'vm',
    controller: function ($scope, $http, modal) {
      var vm = this;

      vm.canPost = user.hasPermission({ access: 'POST', resource: '/config/notification-settings' });
      vm.canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/notification-settings/*' });

      function refresh() {
        $http.get('/api/v1/config/notification-settings').then(function (response) {
          vm.data = response.data;
        });
      }

      vm.delete = function (entry) {
        var id = entry.NotificationSettingsId;
        modal.confirmation({
          title: 'Delete Notification Settings',
          message: 'Are you sure you want to delete the <strong>' + id + '</strong> notification settings?',
          action: 'Delete',
          severity: 'Danger',
        }).then(function () {
          $http.delete('/api/v1/config/notification-settings/' + id).then(refresh);
        });
      };

      vm.viewHistory = function (entry) {
        $scope.ViewAuditHistory('NotificationSettings', entry.NotificationSettingsId);
      };

      refresh();
    }
  });