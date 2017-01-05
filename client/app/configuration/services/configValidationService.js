/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').factory('configValidation',
  function ($q, resources, cachedResources) {

    var TYPE_ENV = 'Environment';
    var TYPE_SERVICE = 'Service';
    var TYPE_DEP_MAP = 'DeploymentMap';
    var TYPE_LBSETTING = 'LBSetting';
    var TYPE_LBUPSTREAM = 'Upstream';

    function Node(type, name, parentNode) {
      this.EntityType = type;
      this.EntityName = name;
      this.Valid = false;
      this.DataFound = true;
      this.Error = '';
      this.Parent = parentNode;
      this.Children = [];
    }

    function ConfigValidator() {

      var self = this;

      self.ValidateEnvironmentSetupCache = function (envName) {
        var deferred = $q.defer();
        $q.all([
          // Make sure cache populated to avoid async multiple hits
          cachedResources.config.environments.all(),
          cachedResources.config.services.all(),
          cachedResources.config.lbUpstream.all(),
          cachedResources.config.deploymentMaps.all(),
          cachedResources.config.lbSettings.all(),
        ]).then(function () {
          self.ValidateEnvironment(envName).then(function (node) {
            deferred.resolve(node);
          });
        });

        return deferred.promise;
      };

      // NOTE: If calling for multiple environments call setupCache version instead as will avoid heavy repeat cache population
      self.ValidateEnvironment = function (envName) {
        var deferred = $q.defer();
        BuildNode(TYPE_ENV, envName, 'EnvironmentName', 'environments', getEnvirommentDelegates, null).then(function (node) {

          // No link directly from Environments to LBSettings so load LB nodes and add to tree
          cachedResources.config.lbSettings.all().then(function (lbSettings) {
            var settingsForEnv = lbSettings.filter(function (lb) {
              return lb.EnvironmentName == envName; });

            var delegates = [];
            settingsForEnv.forEach(function (lb) {
              delegates.push(BuildNode(TYPE_LBSETTING, lb.VHostName, 'VHostName', 'lbSettings', getLBSettingDelegates, node));
            });

            $q.all(delegates).then(function () {
              node.Valid = node.Children.every(function (childNode) {
                return childNode.Valid; });

              deferred.resolve(node);
            });
          });

        });

        return deferred.promise;
      };

      function getEnvirommentDelegates(environment, parentNode) {
        var delegates = [];
        var depMapName = environment.Value.DeploymentMap;
        delegates.push(BuildNode(TYPE_DEP_MAP, depMapName, 'DeploymentMapName', 'deploymentMaps', getDeploymentMapDelegates, parentNode));
        return delegates;
      }

      function getDeploymentMapDelegates(map, parentNode) {
        var delegates = [];
        map.Value.DeploymentTarget.forEach(function (target) {
          target.Services.forEach(function (service) {
            delegates.push(BuildNode(TYPE_SERVICE, service.ServiceName, 'ServiceName', 'services', noDelegates, parentNode));
          });
        });

        return delegates;
      }

      function getLBSettingDelegates(lbSetting, parentNode) {
        var delegates = [];
        lbSetting.Value.Locations.forEach(function (location) {
          if (location.ProxyPass) {
            var upstreamName = location.ProxyPass.replace('http://', '').replace('https://', '');
            delegates.push(BuildNode(TYPE_LBUPSTREAM, upstreamName, 'Value.UpstreamName', 'lbUpstream', getUpstreamDelegates, parentNode));
          }
        });

        return delegates;
      }

      function getUpstreamDelegates(upstream, parentNode) {
        var delegates = [];
        delegates.push(BuildNode(TYPE_SERVICE, upstream.Value.ServiceName, 'ServiceName', 'services', noDelegates, parentNode));
        return delegates;
      }

      function noDelegates() {
        return $q.when(true);
      }

      function BuildNode(nodeType, entityName, nameAttrib, cacheResourceName, getDelegatesFunction, parentNode) {
        var deferred = $q.defer();
        var node = new Node(nodeType, entityName);
        cachedResources.config[cacheResourceName].all().then(function (data) {

          var entity = cachedResources.config[cacheResourceName].getByName(entityName, nameAttrib, data);
          if (entity) {
            $q.all(getDelegatesFunction(entity, node)).then(function success() {

              // De-dupe children to get unique dependencies
              var uniqueNames = [];
              node.Children = node.Children.filter(function (childNode) {
                var nameUnique = (uniqueNames.indexOf(childNode.EntityName) == -1);
                if (nameUnique) { uniqueNames.push(childNode.EntityName); }

                return nameUnique;
              });

              node.Valid = node.Children.every(function (childNode) {
                return childNode.Valid; });

              if (!node.Valid) {
                node.Error = 'Config missing dependencies';
              }
            }, function error(err) {

              node.Valid = false;
              node.Error = 'Error processing dependencies';
            }).finally(function () {
              node.Parent = parentNode;
              if (parentNode) parentNode.Children.push(node);
              deferred.resolve(node);
            });
          } else {
            node.Valid = false;
            node.DataFound = false;
            node.Error = 'Not found';
            node.Parent = parentNode;
            if (parentNode) parentNode.Children.push(node);
            deferred.resolve(node);
          }

        });

        return deferred.promise;
      }

    }

    return new ConfigValidator();
  });
