(function () {
    'use strict';

    angular
        .module('EnvironmentManager.common')
        .factory('cacheservice', cacheservice);

    cacheservice.$inject = ['$http']

    function cacheservice($http) {
        return {
            reset: reset
        }

        function reset(environment) {
            console.log('Sending HTTP for reset: POST ' + environment + '/diagnostics/cachereset');
        }
    }
})()
