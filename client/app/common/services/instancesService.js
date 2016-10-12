/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('instancesService',
  function ($http) {
    return {
      setMaintenanceMode: function(accountName, instanceId, enable) {
        var url = ['api', 'v1', 'instances', instanceId, 'asg-standby'].join('/');
        return $http.put(url, { enable: enable }).then(function (response) {
          return response.data;
        });
      }
    };

  });
