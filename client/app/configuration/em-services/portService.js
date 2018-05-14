/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.configuration')
    .factory('portservice', portservice);

  portservice.$inject = ['$http'];

  function portservice($http) {
    return {
      getNextSequentialPair: getNextSequentialPair,
      isPortInUse: isPortInUse
    };

    function getNextSequentialPair() {
      return getPorts()
        .then(function findPairFromPorts(takenPorts) {
          for (var i = 40000; i < 41000; i += 1) {
            if (!_.includes(takenPorts, i) && !_.includes(takenPorts, i + 1)) {
              return createPortPair(i);
            }
          }
          return { Blue: 0, Green: 0 };
        });

      function createPortPair(i) {
        if ((i % 2) === 0) return { Blue: i, Green: i + 1 };
        return { Blue: i + 1, Green: i };
      }
    }

    function isPortInUse(portNumber) {
      if(!portNumber) return;
      if(portNumber.toString().length < 5) return;

      return getPorts().then(function (ports) {
        return ports.find(function (p) {
          return p === portNumber;
        });
      });
    }

    function getPorts() {
      return $http({
        method: 'GET',
        url: '/api/v1/config/services',
        headers: { 'expected-version': 0 }
      }).then(function createPortsList(result) {
        var results = [];
        result.data.forEach(function (service) {
          if (service.Value) {
            results.push(service.Value.GreenPort * 1);
            results.push(service.Value.BluePort * 1);
          }
        });
        return results;
      });
    }
  }
}());
