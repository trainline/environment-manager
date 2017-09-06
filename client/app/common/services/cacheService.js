'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('cacheservice', cacheservice);

  cacheservice.$inject = ['$http'];

  function cacheservice($http) {
    var url = '/flushcache/';

    return {
      flush: flush
    };

    function flush(environment, hosts) {
      return $http.post(url + environment, {
        hosts: hosts
      });
    }
  }
}());
