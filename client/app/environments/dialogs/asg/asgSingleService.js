/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').component('asgSingleService', {
  templateUrl: '/app/environments/dialogs/asg/asgSingleService.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controllerAs: 'vm',
  controller: function (roles, Deployment, $http) {
    var vm = this;

    this.$onInit = function () {
      var asg = vm.resolve.asg;
      var asgState = vm.resolve.asgState;
      
      vm.service = _.find(asgState.Services, { Name: vm.resolve.serviceName });
      var instances = _.filter(asgState.Instances, function (instance) {
        return _.some(instance.Services, { Name: vm.service.Name });
      });

      // We need to clone this structiure first to modify, as it's shared
      instances = _.clone(instances);
      _.each(instances, function (instance) {
        instance.serviceObject = _.find(instance.Services, { Name: vm.service.Name });
      });
      vm.instances = instances;
    };

  }
});
