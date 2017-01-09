/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .component('notificationSettingsList', {
    templateUrl: '/app/configuration/notification-settings/notificationSettingsList.html',
    controllerAs: 'vm',
    controller: function ($scope, $http) {
      var vm = this;

      vm.canPost = user.hasPermission({ access: 'POST', resource: '/config/notification-settings' });
      vm.canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/notification-settings/*' });

      vm.delete = function (entry) {
        var id = entry.NotificationSettingsId;
        modal.confirmation({
          title: 'Delete Notification Settings',
          message: 'Are you sure you want to delete the <strong>' + id + '</strong> notification settings?',
          action: 'Delete',
          severity: 'Danger',
        }).then(function () {
          resources.config.notificationSettings.delete({ key: id }).then(refresh);
          cachedResources.config.notificationSettings.flush();
        });
      };

      vm.viewHistory = function (entry) {
        $scope.ViewAuditHistory('Cluster', entry.NotificationSettingsId);
      };

    }
  });