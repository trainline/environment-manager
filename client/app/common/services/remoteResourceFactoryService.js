/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('remoteResourceFactory',
  function ($q, $http, $rootScope) {

    function InternalRemoteResource(params) {

      var resourceName = params.name;
      var resourceDescription = params.description;
      var resourceSection = params.section || '';
      var resourcePerAccount = params.perAccount;

      function arraify(target) {
        return Array.isArray(target) ? target : [target];
      }

      function querify(query) {
        var querystring = '';
        if (!query) return querystring;

        for (var property in query) {
          arraify(query[property]).forEach(function (value) {
            querystring += (querystring.length) ? '&' : '?';
            querystring += property + '=' + encodeURIComponent(value);
          });
        }

        return querystring;
      }

      function urlify(params) {
        var segments = ['api'];

        if (params && params.account) segments.push(params.account);

        if (resourceSection) segments.push(resourceSection);

        segments.push(resourceName);

        if (params && params.key) segments.push(encodeURIComponent(params.key));
        if (params && params.range) segments.push(encodeURIComponent(params.range));

        return '/' + segments.join('/') + '/';
      }

      function promisify(delegate) {
        return delegate.then(function (response) {

          var data = response.data;

          if (params.name === 'audit') {
            data = {items:response.data};
            data.headers = response.headers;
          } 
  
          return data;
        }, function (error) {
          $rootScope.$broadcast('error', error);
          throw error;
        });
      }

      function getExpectedVersionHeader(expectedVersion) {
        if (!expectedVersion) return {};
        return {
          headers: {
            'expected-version': expectedVersion,
          },
        };
      }

      function cleanData(data) {
        function internalCleaning(data) {
          for (var property in data) {
            var value = data[property];
            var type = typeof value;

            switch (type) {
              case 'string':
                if (value === '') delete data[property];
                break;
              case 'object':
                internalCleaning(value);
                break;
            }
          }
        }

        internalCleaning(data);
        return data;
      };

      this.name = function () {
        return resourceName;
      };

      this.description = function () {
        return resourceDescription;
      };

      this.all = function (params) {
        var url = urlify(params);
        if (params && params.query) url += querify(params.query);
        return promisify($http.get(url));
      };

      this.export = function (params) {
        var url = '/api/';
        if (params && params.account) {
          url += params.account + '/';
        }

        url += 'config/' + resourceName + '/export';
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
        var data = cleanData(params.data);

        return promisify($http.put(url, data, config));
      };

      this.post = function (params) {
        var url = urlify(params);
        var data = cleanData(params.data);

        return promisify($http.post(url, data));
      };

      this.replace = function (params) {
        var url = '/api/';
        if (params && params.account && resourcePerAccount) {
          url += params.account + '/';
        }

        url += 'config/' + resourceName + '/replace';
        return promisify($http.put(url, params.items));
      };

      this.merge = function (params) {
        var url = '/api/';
        if (params && params.account && resourcePerAccount) {
          url += params.account + '/';
        }

        url += 'config/' + resourceName + '/merge';
        return promisify($http.put(url, params.items));
      };
    };

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
    };

    function ReadOnlyRemoteResource(params) {
      var _resource = new InternalRemoteResource(params);

      this.name = _resource.name;
      this.description = _resource.description;
      this.all = _resource.all;
      this.get = _resource.get;
    };

    return {
      getFullAccess: function (params) {
        return new FullAccessRemoteResource(params);
      },

      getReadOnly: function (params) {
        return new ReadOnlyRemoteResource(params);
      },
    };
  });
