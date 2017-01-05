/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('enums',
  function () {

    var MILLISECONDS = {
      PerHour: 3600000,
      PerDay: 86400000,
    };

    return {
      MILLISECONDS: MILLISECONDS,
    };

  });
