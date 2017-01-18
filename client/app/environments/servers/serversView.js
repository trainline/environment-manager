/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').factory('serversView',
  function () {
    var statusClasses = {
      healthy: 'glyphicon-ok-sign success',
      warning: 'glyphicon-alert warning',
      error: 'glyphicon-alert error'
    };

    function serversView(data, selections) {
      var roles = data.Value;

      var roleViews = data.Value
        .map(toRoleView)
        .filter(rolesMatchingSelections(selections));

      var aggregateViews = toAggregationsView(data.Value);

      var allServerRoles = _.uniq(roles.map(function (role) {
        return role.Role;
      }));

      var allServiceNames = _.uniq(_.flatten(roles.map(function (role) {
        return role.Services.map(getServiceName);
      })));

      var allServersCount = _.sumBy(roleViews, 'sizeCurrent');
      if (_.sumBy(roleViews, 'sizeDesired') !== allServersCount) {
        allServersCount = _.sumBy(roleViews, 'sizeCurrent') + '/' + _.sumBy(roleViews, 'sizeDesired');
      }

      return {
        allServersCount: allServersCount,
        hasRoles: roles.length > 0,
        roles: roleViews,
        aggregations: aggregateViews,
        allServerRoles: allServerRoles,
        allServiceNames: allServiceNames
      };
    }

    function toRoleView(role) {
      return {
        asgName: role.Name,
        serverRole: {
          name: role.Role,
          status: {
            status: role.Status.Status,
            reason: role.Status.Reason,
            class: statusClasses[role.Status.Status.toLowerCase()]
          }
        },
        isBeingDeleted: role.IsBeingDeleted,
        owningCluster: role.Cluster,
        services: role.Services.map(toServiceView),
        size: toSizeView(role.Size),
        sizeCurrent: role.Size.Current,
        sizeDesired: role.Size.Desired,
        hasScalingSchedule: role.Schedule === 'NOSCHEDULE',
        ami: toAmiView(role.Ami),
        schedule: role.Schedule
      };
    }

    function toServiceView(service) {
      return {
        name: getServiceName(service),
        version: service.Version
      };
    }

    function rolesMatchingSelections(selected) {
      return function (role) {
        var selectedStatus = selected.status.toLowerCase();
        var selectedCluster = selected.cluster.toLowerCase();

        var statusMatches = selectedStatus === 'any' || role.serverRole.status.status.toLowerCase() === selectedStatus;
        var clusterMatches = selectedCluster === 'any' || role.owningCluster.toLowerCase() === selectedCluster;
        var roleNameMatches = !selected.serverRole || _.includes(role.serverRole.name.toLowerCase(), selected.serverRole.toLowerCase());
        var serviceNameMatches = !selected.serviceName || _.some(role.services, function (service) {
          return _.includes(service.name.toLowerCase(), selected.serviceName.toLowerCase());
        });

        return statusMatches && clusterMatches && roleNameMatches && serviceNameMatches;
      };
    }

    function toAggregationsView(roles) {
      var result = {
        servers: {
          healthy: { count: 0 },
          warning: { count: 0 },
          error: { count: 0 }
        },
        services: {
          healthy: { count: 0 },
          warning: { count: 0 },
          error: { count: 0 }
        }
      };

      roles.forEach(function (role) {
        result.servers[role.Status.Status.toLowerCase()].count += 1;
      });

      return result;
    }

    function getServiceName(service) {
      var name = service.FriendlyName;

      if (service.Slice && service.Slice.toLowerCase() != 'none') {
        name += ' [' + service.Slice + ']';
      }

      return name;
    }

    function toAmiView(ami) {
      if (ami) {
        return {
          name: ami.Name,
          age: ami.Age + ' day(s)',
          isLatestStable: ami.IsLatestStable
        };
      }

      return {
        name: '-',
        age: '-'
      };
    }

    function toSizeView(size) {
      if (size.Current !== size.Desired) {
        return size.Current + '/' + size.Desired;
      }

      return size.Current;
    }

    return serversView;
  });
