/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('loading',
  function () {
    var loadingOverlay;

    return {
      registerLoadingOverlay: function (overlay) {
        loadingOverlay = overlay;
      },
      lockPage: function (locked) {
        loadingOverlay.visible = locked;
      }
    }
    
  });

