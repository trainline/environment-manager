/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('remoteResourceFactory',
  function ($q, $http, $rootScope) {
    function InternalRemoteResource(params) {
      var resourceName = params.name;
      var resourceDescription = params.description;
      var resourceSection = params.section;
      var resourcePerAccount = params.perAccount;

      function urlify(params) {
        var segments = ['api', 'v1'];

        if (resourceSection !== undefined) segments.push(resourceSection);

        segments.push(resourceName);

        if (params && params.key) segments.push(encodeURIComponent(params.key));
        if (params && params.range) segments.push(encodeURIComponent(params.range));

        return '/' + segments.join('/') + '/';
      }

      function promisify(delegate) {
        return delegate.then(function (response) {
          var data = response.data;

          if (params.name === 'audit') {
            data = { items: response.data };
            data.headers = response.headers;
          }

          return data;
        }, function (error) {
          $rootScope.$broadcast('error', error);
          throw error;
        });
      }

      function getExpectedVersionHeader(expectedVersion) {
        if (expectedVersion === undefined) return {};
        return {
          headers: {
            'expected-version': expectedVersion
          }
        };
      }

      this.name = function () {
        return resourceName;
      };

      this.description = function () {
        return resourceDescription;
      };

      this.all = function (params) {
        var url = urlify(params);
        var query;
        if (params && params.query) query = params.query;
        return promisify($http.get(url, { params: query }));
      };

      this.export = function (params) {
        var url = '/api/v1/config/export/' + resourceName.toLowerCase();
        return promisify($http.get(url));
      };

      this.get = function (params) {
        var url = urlify(params);
        return promisify($http.get(url));
        // TODO: Return header as Version attribute
      };

      this.delete = function (params) {
        var url = urlify(params);
        return promisify($http.delete(url));
      };

      this.put = function (params) {
        var url = urlify(params);
        var config = getExpectedVersionHeader(params.expectedVersion);

        return promisify($http.put(url, params.data, config));
      };

      this.post = function (params) {
        var url = urlify(params);

        return promisify($http.post(url, params.data));
      };
    }

    function FullAccessRemoteResource(params) {
      var _resource = new InternalRemoteResource(params);

      this.name = _resource.name;
      this.description = _resource.description;
      this.all = _resource.all;
      this.get = _resource.get;
      this.delete = _resource.delete;
      this.put = _resource.put;
      this.post = _resource.post;
      this.export = _resource.export;
      this.replace = _resource.replace;
      this.merge = _resource.merge;
    }

    function ReadOnlyRemoteResource(params) {
      var _resource = new InternalRemoteResource(params);

      this.name = _resource.name;
      this.description = _resource.description;
      this.all = _resource.all;
      this.get = _resource.get;
    }

    return {
      getFullAccess: function (params) {
        return new FullAccessRemoteResource(params);
      },

      getReadOnly: function (params) {
        return new ReadOnlyRemoteResource(params);
      }
    };
  });
