/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('asgservice', asgservice);

  asgservice.$inject = ['$http'];

  function asgservice($http) {
    var url = '/api/v1/asgs/';

    return {
      delete: remove
    };

    /**
     * Remove the desired ASG in the target environment.
     * @param { Object: { asgName: String, environmentName: String } } params
     */
    function remove(params) {
      if (!params) throw new Error('Cannot delete an ASG when given no parameters.');
      if (!params.environmentName) throw new Error('Cannot delete an ASG when given no environment name.');
      if (!params.asgName) throw new Error('Cannot delete an ASG when given no asg name.');

      var environmentName = params.environmentName;
      var asgName = params.asgName;

      return $http.delete(url + encodeURIComponent(asgName),
        { params: { environment: environmentName } });
    }
  }
}());
