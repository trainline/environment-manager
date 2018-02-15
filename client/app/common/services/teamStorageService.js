/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('teamstorageservice', teamstorageservice);

  teamstorageservice.$inject = ['localstorageservice'];

  function teamstorageservice(localstorageservice) {
    var key = 'em-selections-team';

    return {
      get: get,
      set: set
    };

    function get(defaultValue) {
      var value = '';

      if (defaultValue) value = defaultValue;

      if (localstorageservice.exists(key)) value = localstorageservice.get(key);

      return value;
    }

    function set(value) {
      localstorageservice.set(key, value);
    }
  }
}());
