/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('localResourceFactory',
  function ($q) {
    function LocalResource(source) {
      var dataSource = source;

      this.all = function () {
        return $q.when(dataSource);
      };
    }

    return function (source) {
      return new LocalResource(source);
    };
  });
