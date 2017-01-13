/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular
  .module('EnvironmentManager.configuration')
  .factory('arrayItemHashDetector',
    function () {
      function has(value) {
        return undefined !== value;
      }

      var is = {
        DeploymentMaps: {
          DeploymentTarget: {
            Array: function (object) {
              return has(object.ServerRoleName);
            },

            Services: {
              Array: function (object) {
                return has(object.ServiceName);
              }
            }
          }
        },
        LBUpstream: {
          Hosts: {
            Array: function (object) {
              return has(object.DnsName);
            }
          }
        },
        LBSettings: {
          Listen: {
            Array: function (object) {
              return has(object.Port);
            }
          },
          Locations: {
            Array: function (object) {
              return has(object.Path) && has(object.IfCondition);
            }
          }
        }
      };

      return {
        objectHash: function (object, index) {
          if (is.DeploymentMaps.DeploymentTarget.Array(object)) {
            return object.ServerRoleName;
          }

          if (is.DeploymentMaps.DeploymentTarget.Services.Array(object)) {
            return object.ServiceName;
          }

          if (is.LBUpstream.Hosts.Array(object)) {
            return object.DnsName;
          }

          if (is.LBSettings.Listen.Array(object)) {
            return object.Port + '_' + object.IP;
          }

          if (is.LBSettings.Locations.Array(object)) {
            return object.Path;
          }

          return object;
        }
      };
    });
