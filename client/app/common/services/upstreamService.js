(function () {
    'use strict';

    angular
        .module('EnvironmentManager.common')
        .factory('upstreamservice', upstreamservice);

    upstreamservice.$inject = ['UpstreamConfig']

    function upstreamservice(UpstreamConfig) {
        return {
            all: all
        }

        function all() {
            UpstreamConfig.getAll()
                .then(function (data) {
                    console.log(data)
                })
        }
    }
})()
