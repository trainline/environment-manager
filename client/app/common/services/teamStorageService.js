/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('teamstorageservice', teamstorageservice);

  teamstorageservice.$inject = ['storageservicefactory'];

  function teamstorageservice(storageservicefactory) {
    return storageservicefactory.create('em-selections-team');
  }
}());
