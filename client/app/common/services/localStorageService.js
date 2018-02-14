/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('localstorageservice', localstorageservice);

  localstorageservice.$inject = [];

  function localstorageservice() {
    var localStorage = window.localStorage;

    return {
      get: get,
      set: set,
      exists: exists,
      getValueOrDefault: getValueOrDefault
    };

    function get(key) {
      return localStorage.getItem(key);
    }

    function set(key, value) {
      return localStorage.setItem(key, value);
    }

    function exists(key) {
      if (get(key) === null || get(key) === '') return false;
      return true;
    }

    function getValueOrDefault(key, defaultValue) {
      return exists(key) ? get(key) : defaultValue;
    }
  }
}());
