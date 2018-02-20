/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.configuration')
    .factory('portservice', portservice);

  portservice.$inject = ['$http'];

  function portservice($http) {
    return {
      getPorts: getPorts,
      getNextSequentialPair: getNextSequentialPair,
      isPortInUse: isPortInUse
    };

    function getPorts() {
      return $http({
        method: 'GET',
        url: '/api/v1/config/services',
        headers: { 'expected-version': 0 }
      }).then(function createPortsList(result) {
        return result.data.map(function createPortObject(service) {
          return {
            Green: service.Value.GreenPort * 1,
            Blue: service.Value.BluePort * 1
          };
        });
      });
    }

    function getNextSequentialPair() {
      return markPortAvailability(generatePortPairs(), getPorts())
        .then(function (portPairs) {
          var nextAvailable = portPairs.find(function (pair) {
            return pair.Available === true;
          });

          return nextAvailable || { Green: 0, Blue: 0 };
        });
    }

    function isPortInUse(portNumber) {
      return getPorts().then(function (ports) {
        return ports.find(function (p) {
          return p.Blue === portNumber || p.Green === portNumber;
        });
      });
    }
  }

  function generatePortPairs() {
    var range = { bottom: 40000, top: 41000 };

    return [...Array((range.top - range.bottom) / 2).keys()]
      .map(function (index) {
        return {
          Available: true,
          Blue: range.bottom + (index - 1),
          Green: range.bottom + index
        };
      });
  }

  function markPortAvailability(portPairs, takenPorts) {
    return takenPorts.then(function (ports) {
      portPairs.forEach(function (pair) {
        var blue = ports.find(function (tp) { return (tp.Blue) === (pair.Blue); });
        var green = ports.find(function (tp) { return (tp.Green) === (pair.Green); });

        if (blue || green) pair.Available = false;
      });
      return portPairs;
    });
  }
}());
