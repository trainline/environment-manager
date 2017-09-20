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

    /**
     * Send 'resetcache' message to target all services in {{environment}}
     * @param {String} environment
     * @param {Object: {host: String, port: Number, environment: String }} hosts
     */
    function flush(environment, hosts) {
      return $http.post(url + environment, {
        hosts: hosts
      });
    }
  }
}());
