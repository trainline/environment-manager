/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('storageservicefactory', storageservicefactory);

  storageservicefactory.$inject = ['localstorageservice'];

  function storageservicefactory(localstorageservice) {
    return {
      create: create
    };

    function create(key) {
      return {
        get: function get(defaultValue) {
          var value = '';

          if (defaultValue) value = defaultValue;

          if (localstorageservice.exists(key)) value = localstorageservice.get(key);

          return value;
        },

        set: function set(value) {
          localstorageservice.set(key, value);
        }
      };
    }
  }
}());
