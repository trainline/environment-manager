/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';


/* Audit Table Structure:
 *   AuditID [GUID Key]
 *   TransactionID (GUID)
 *   Entity
 *       Type
 *       Key
 *       Range (optional)
 *       Version (int)
 *   ChangeType
 *   OldValue
 *   NewValue
 *   ChangedBy
 *   Timestamp
 *   Environment      (TODO: Future change. Where we know it anyway – useful for filter)
 *   Owning Cluster   (TODO: Future change. Where we know it anyway – useful for filter)
 */
angular.module('EnvironmentManager.configuration').controller('AuditController',
  function ($scope, $routeParams, $location, $q, $http, $uibModal, resources, arrayItemHashDetector, modal, enums, linkHeader, QuerySync) {
    var vm = this;

    var SHOW_ALL_OPTION = 'Any';

    $scope.Data = [];

    $scope.EntityTypesList = [];
    $scope.ChangeTypesList = [];
    $scope.DateRangeList = [
      { Name: 'Today', Value: 0 * enums.MILLISECONDS.PerDay },
      { Name: 'Last 2 days', Value: 1 * enums.MILLISECONDS.PerDay },
      { Name: 'Last 3 days', Value: 2 * enums.MILLISECONDS.PerDay },
      { Name: 'Last 7 days', Value: 6 * enums.MILLISECONDS.PerDay },
      { Name: 'Last 30 days', Value: 29 * enums.MILLISECONDS.PerDay },
    ];

    $scope.SelectedEntityType = SHOW_ALL_OPTION;
    $scope.SelectedChangeType = SHOW_ALL_OPTION;
    $scope.SelectedEntityKey = '';
    $scope.SelectedEntityRange = '';
    $scope.SelectedDateRangeValue = $scope.DateRangeList[0].Value; // Today
    $scope.hasNextPage = false;
    $scope.DataLoading = false;
    $scope.SearchPerformed = false;

    // Following defines how compare items in the same array for comparison purposes
    $scope.DiffOptions = arrayItemHashDetector;

    function init() {
      var entityType = $routeParams['entityType'];
      var key = $routeParams['key'];
      var range = $routeParams['range'];

      if (key) { $scope.SelectedEntityKey = decodeURIComponent(key); }

      if (range) { $scope.SelectedEntityRange = decodeURIComponent(range); }

      $q.all([
        resources.audit.entityTypes.all().then(function (entityTypes) {
          $scope.EntityTypesList = [{ Name: SHOW_ALL_OPTION, Value: SHOW_ALL_OPTION }].concat(entityTypes);
          if (entityType) {
            // Match default Entity Name passed by URL to matching entity type Value
            for (var i = 0; i < entityTypes.length; i++) {
              if (entityTypes[i].Name == entityType) {
                $scope.SelectedEntityType = entityTypes[i].Value;
                break;
              }
            }
          }
        }),

        resources.audit.changeTypes.all().then(function (changeTypes) {
          $scope.ChangeTypesList = [SHOW_ALL_OPTION].concat(changeTypes).sort();
        }),
      ]).then(function () {
        vm.refresh();
      });
    }

    $scope.Compare = function (audit) {
      $uibModal.open({
        templateUrl: '/app/configuration/audit/audit-compare-modal.html',
        controller: 'AuditCompareModalController',
        size: 'lg',
        resolve: {
          audit: function () { return audit; },
        },
      });
    };

    vm.refresh = function () {

      $scope.DataLoading = true;
      $scope.SearchPerformed = true;

      var query = {};

      if ($scope.SelectedEntityType != SHOW_ALL_OPTION) {
        query['Entity.Type'] = $scope.SelectedEntityType;
      }

      if ($scope.SelectedChangeType != SHOW_ALL_OPTION) {
        query['ChangeType'] = $scope.SelectedChangeType;
      }

      if ($scope.SelectedEntityKey) {
        query['Entity.Key'] = $scope.SelectedEntityKey;
      }

      if ($scope.SelectedEntityRange && $scope.SelectedEntityHasRange()) {
        query['Entity.Range'] = $scope.SelectedEntityRange;
      }

      if (Number.isInteger($scope.SelectedDateRangeValue)) {
        var dateNow = new Date().getTime();
        dateNow -= ($scope.SelectedDateRangeValue);
        query.since = new Date(dateNow).toISOString();
      }

      var params = {
        account: 'all', // Always retrieve audit for all accounts
        query: query,
      };
      resources.audit.history.all(params).then(function (data) {
        displayResults(data);
      });
    };

    /**
     * Returns a JSON representation of an object for diff generation.
     * Any property values that are valid JSON representations
     * of composite objects (Object or Array) are parsed before
     * converting the root object to JSON.
     * 
     * @param obj {Object} any object
     * @returns {String} JSON representation of object 
     */
    function diffableRepresentationOf(obj) {
      function replacer(key, value) {
        if (typeof value === 'string' && /^[\[\{]/.test(value)) {
          try {
            return JSON.parse(value);
          } catch (error) {
            return value;
          }
        } else {
          return value;
        }
      }
      return JSON.stringify(obj, replacer, 4);
    }

    function displayResults(data) {
      var link = linkHeader.parseHeaders(data.headers);
      $scope.nextPage = link !== undefined ? link.next : undefined;
      $scope.hasNextPage = $scope.nextPage !== undefined;
      $scope.Data = data.items.map(function (audit) {
        if (audit.OldValue) { // Missing for new records
          audit.OldValueDisplay = diffableRepresentationOf(audit.OldValue);
        }

        if (audit.NewValue) { // Missing for deleted records
          audit.NewValueDisplay = diffableRepresentationOf(audit.NewValue);
        }

        return audit;
      });
      $scope.DataLoading = false;
    }

    $scope.getPage = function (pageData){
      $scope.DataLoading = true;
      $http.get(pageData).then(function (response) {
          displayResults({ items:response.data, headers:response.headers });
          $scope.DataLoading = false;
      });
    }

    $scope.Restore = function (audit) {
      var modalParameters = {
        title: 'Restore Previous Version',
        message: 'Are you sure you want to restore <strong>' + audit.Entity.Type + '</strong> data?',
        action: 'Restore',
        severity: 'Warning',
        details: ['<pre style="height:450px; overflow-y:scroll">' + audit.NewValueDisplay + '</pre>'],
      };
      modal.confirmation(modalParameters).then(function () {
        var resource = null;
        for (var property in resources.config) {
          if (property.toLowerCase() === audit.Entity.Type) {
            resource = resources.config[property];
          }
        }

        var params = {
          account: audit.AccountName,
          items: audit.NewValue,
        };
        resource.merge(params).then(function () {
          vm.refresh();
        });
      });
    };

    $scope.SelectedEntityHasRange = function () {
      return ($scope.SelectedEntityType == 'LBSettings' || $scope.SelectedEntityType == 'LBUpstream');
    };

    init();
  });
