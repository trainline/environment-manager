/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('loadBalancerService', loadBalancerService);

  loadBalancerService.$inject = [];

  function loadBalancerService() {
    return {
      getJsonStructure: getJsonStructure,
      getStructure: getStructure
    };

    function getJsonStructure() {
      return JSON.stringify(getStructure(), null, 4);
    }

    function getStructure() {
      return {
        SchemaVersion: 1,
        EnvironmentName: '',
        VHostName: '',
        Listen: [
          { Port: '' }
        ],
        ServerName: [''],
        FrontEnd: false,
        Locations: [{
          Path: '',
          Priority: 1,
          IfCondition: '',
          IfConditionPriority: 1,
          Tokenise: false,
          ProxySetHeaders: [''],
          ProxyPass: '',
          Healthcheck: {
            Interval: 0,
            Fails: 0,
            Passes: 0,
            URI: ''
          },
          ProxyHttpVersion: '',
          AddHeaders: [''],
          ReturnCode: 0,
          ReturnURI: '',
          MoreHeaders: ['header:value'],
          RewriteCondition: '',
          RewriteURI: '',
          RewriteState: '',
          Rewrites: {
            Condition: '',
            URI: '',
            State: ''
          },
          RawNginxConfig: '',
          Set: '',
          TryFiles: '',
          CustomErrorCodes: ['all'],
          CacheTime: ''
        }]
      };
    }
  }
}());
