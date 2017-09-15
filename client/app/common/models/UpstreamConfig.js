/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('UpstreamConfig',
  function ($q, $http) {
    var baseUrl = '/api/v1/config/upstreams';

    function UpstreamConfig(data) {
      data.Value.Hosts.sort(function (a, b) {
        return a.DnsName.localeCompare(b.DnsName);
      });
      _.assign(this, data);
    }

    UpstreamConfig.getByKey = function (key, account) {
      return $http.get(baseUrl + '/' + encodeURIComponent(key), { params: { account: account } })
        .then(function (response) {
          return new UpstreamConfig(response.data);
        });
    };

    UpstreamConfig.getAll = function () {
      return $http.get(baseUrl).then(function (response) {
        return response.data;
      });
    };

    UpstreamConfig.getForEnvironment = function (environment) {
      return $http.get(baseUrl + '?qa=environment&qv=' + environment).then(function (response) {
        return response.data;
      });
    };

    UpstreamConfig.deleteByKey = function (key) {
      return $http.delete(baseUrl + '/' + encodeURIComponent(key));
    };

    UpstreamConfig.createWithDefaults = function (environmentName) {
      // New Upstream, set defaults
      var data = {
        Value: {
          SchemaVersion: 1,
          EnvironmentName: environmentName,
          ZoneSize: '128k',
          LoadBalancingMethod: 'least_conn',
          Hosts: [],
          MarkForDelete: false,
          MarkForDeleteTimestamp: 0
        },
        Version: 0
      };
      return new UpstreamConfig(data);
    };

    function getUtcTimestampForTwentyMinutesFromNow() {
      return moment(new Date()).add(20, 'minutes').valueOf();
    }

    _.assign(UpstreamConfig.prototype, {
      update: function (key) {
        return $http({
          method: 'put',
          url: baseUrl + '/' + encodeURIComponent(key),
          data: this.Value,
          headers: { 'expected-version': this.Version }
        });
      },

      markForDelete: function (key) {
        var updatedData = Object.assign({},
          this.Value,
          {
            MarkForDelete: true,
            MarkForDeleteTimestamp: getUtcTimestampForTwentyMinutesFromNow()
          }
        );
        return $http({
          method: 'put',
          url: baseUrl + '/' + encodeURIComponent(key),
          data: updatedData,
          headers: { 'expected-version': this.Version }
        });
      },

      save: function (key) {
        return $http({
          method: 'post',
          url: baseUrl,
          data: { Value: this.Value, key: key },
          headers: { 'expected-version': this.Version }
        });
      }
    });

    return UpstreamConfig;
  });
