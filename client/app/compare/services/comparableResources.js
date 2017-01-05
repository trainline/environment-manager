/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.compare').factory('comparableResources',
  function (resources, $q, accountMappingService) {
    return [{
      key: 'versions',
      name: 'Service Versions',
      keyName: 'Service Name',
      get: function (environments) {

        var environmentNames = environments.map(function (env) { return env.EnvironmentName; });

        return $q.all(environmentNames.map(function (environmentName) {
          return accountMappingService.getAccountForEnvironment(environmentName).then(function (accountName) {
            return {
              account: accountName,
              environment: environmentName,
            };
          });
        })).then(function (environments) {
          return $q.all(environments.map(function (env) {
            return resources.roles.get(env.account, env.environment);
          }));
        }).then(_.flatten).then(function (environments) {
          var results = _.flatMapDeep(environments, function (env) {

            var arr = env.Value.map(function (serverRole) {
              return serverRole.Services.map(function (service) {
                var serverRoleName = serverRole.Role;
                var obj = {
                  serviceName: service.Name,
                  serverRoleName: serverRoleName,
                  environmentName: env.EnvironmentName,
                  serviceVersion: service.Version,
                  slice: service.Slice,
                };

                return obj;
              });
            });

            var arr = _.flatten(arr);
            var grouped = _.groupBy(arr, 'serviceName');

            return _.reduce(grouped, function(results, serverRoles, key) {

              var obj = {
                key: serverRoles[0].serviceName,
                EnvironmentName: serverRoles[0].environmentName,
                deployments: [],
                serverRoles: {}
              };

              _.forEach(serverRoles, function(item, key) {
                if (obj.serverRoles[item.serverRoleName] === undefined) {
                  obj.serverRoles[item.serverRoleName] = [];
                }

                var deployment = {
                  version: item.serviceVersion,
                  slice: item.slice,
                };
                obj.serverRoles[item.serverRoleName].push(deployment);
                
                if (_.find(obj.deployments, { version: item.serviceVersion }) === undefined) {
                  obj.deployments.push(deployment);
                }
              });

              results.push(obj);

              return results;
            }, []);

            return arr;
          });

          return results;
        });
      },
    }, {
      key: 'loadbalancers',
      name: 'Load Balancers',
      keyName: 'Host Name',
      get: function (environments) {

        var environmentNames = environments.map(function (env) {
          return env.EnvironmentName; });

        return $q.all(environmentNames.map(function (environmentName) {
          return accountMappingService.getAccountForEnvironment(environmentName);
        })).then(function (accounts) {
          return _.uniq(accounts);
        }).then(function (accounts) {
          return $q.all(accounts.map(function (account) {
            var params = { account: account };
            return resources.config.lbSettings.all(params);
          }));
        }).then(function (results) {
          return _.flatten(results).filter(function (result) {
            return _.includes(environmentNames, result.Value.EnvironmentName);
          });
        }).then(function (results) {
          return results.map(function (lb) {
            function toKey(envName, val) {
              var r = new RegExp('^(?:' + envName + '-)?(.*?)(?:.ttl.*)?$');
              var matches = r.exec(val);
              return matches ? matches[1].toLowerCase() : val;
            }

            lb.EnvironmentName = lb.Value.EnvironmentName;
            lb.key = toKey(lb.EnvironmentName, lb.Value.VHostName);
            lb.Value.Locations.forEach(function (location) {
              if (location.ProxyPass) {
                location.ProxyPass = location.ProxyPass.replace(lb.EnvironmentName, '{env}');
              }
            });

            if (lb.Value.ServerName && Array.isArray(lb.Value.ServerName)) {
              lb.Value.ServerName = lb.Value.ServerName.map(function (serverName) {
                return serverName.replace(lb.EnvironmentName, '{env}');
              });
            }

            delete lb.Value.EnvironmentName;
            delete lb.Value.VHostName;
            return lb;
          });
        });
      },
    }, {
      key: 'upstreams',
      name: 'Upstreams',
      keyName: 'Upstream',
      get: function (environments) {

        var environmentNames = environments.map(function (env) {
          return env.EnvironmentName; });

        return $q.all(environmentNames.map(function (environmentName) {
          return accountMappingService.getAccountForEnvironment(environmentName);
        })).then(function (accounts) {
          return _.uniq(accounts);
        }).then(function (accounts) {
          return $q.all(accounts.map(function (account) {
            var params = { account: account };
            return resources.config.lbUpstream.all(params);
          }));
        }).then(function (results) {
          return _.flatten(results).filter(function (result) {
            return _.includes(environmentNames, result.Value.EnvironmentName);
          });
        }).then(function (results) {
          return results.map(function (upstream) {
            function toKey(envName, val) {
              var r = new RegExp('^(?:' + envName + '-)?(.*?)$');
              var matches = r.exec(val);
              return matches ? matches[1].toLowerCase() : val;
            }

            upstream.EnvironmentName = upstream.Value.EnvironmentName;
            upstream.key = toKey(upstream.EnvironmentName, upstream.Value.UpstreamName);
            upstream.Value.Hosts.forEach(function (host) {
              host.DnsName = host.DnsName.replace(upstream.EnvironmentName, '{env}');
              delete host.State;
            });

            delete upstream.Value.EnvironmentName;
            delete upstream.Value.UpstreamName;
            return upstream;
          });
        });
      },
    },];
  });
