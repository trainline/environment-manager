/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('environmentstorageservice', environmentstorageservice);

  environmentstorageservice.$inject = ['storageservicefactory'];

  function environmentstorageservice(storageservicefactory) {
    return storageservicefactory.create('em-selections-environment');
  }
}());
