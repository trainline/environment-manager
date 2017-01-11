/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').component('asgSingleService', {
  templateUrl: '/app/environments/dialogs/asg/asgSingleService.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controllerAs: 'vm',
  controller: function (roles, Deployment) {
    var vm = this;

    this.$onInit = function () {
      var asg = vm.resolve.asg;
      var asgState = vm.resolve.asgState;
      
      vm.service = _.find(asgState.Services, { Name: vm.resolve.service.Name, Slice: vm.resolve.service.Slice });
      var instances = _.filter(asgState.Instances, function (instance) {
        return _.some(instance.Services, { Name: vm.service.Name, Slice: vm.service.Slice });
      });

      // We need to clone this structiure first to modify, as it's shared
      instances = _.clone(instances);
      _.each(instances, function (instance) {
        instance.serviceObject = _.find(instance.Services, { Name: vm.service.Name, Slice: vm.service.Slice });
      });
      vm.instances = instances;
    };

  }
});
