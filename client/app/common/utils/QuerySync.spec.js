/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

describe('QuerySync', function () {

  var $location;
  var querySync;
  var target;

  beforeEach(module('EnvironmentManager.common'));

  beforeEach(module(function ($provide) {
    $location = jasmine.createSpyObj('$location', ['search']);
    $location.search.and.callFake(function () { return {}; });

    $provide.service('$location', function() {
      return $location;
    });
  }));

  beforeEach(inject(function(QuerySync) {
    target = {};
    querySync = new QuerySync(target, {
      environment: {
        property: 'SelectedEnvironment',
        default: 'pr1',
      },
      cluster: {
        property: 'SelectedOwningCluster',
        default: 'Any',
      },
      date_range: {
        property: 'DateRange',
        default: '2000',
        castToInteger: true,
      }
    });
  }));

  describe('.init()', function () {
    it('uses defaults', function() {
      querySync.init();
      expect(target.SelectedEnvironment).toEqual('pr1');
      expect(target.SelectedOwningCluster).toEqual('Any');
    });

    it('casts to integer', function() {
      querySync.init();
      expect(target.DateRange).toEqual(2000);
    });
  });

  describe('.updateQuery()', function() {
    it('updates query', function() {
      querySync.init();
      target.SelectedEnvironment = 'testval1';
      querySync.updateQuery();
      expect($location.search).toHaveBeenCalledWith('environment', 'testval1');
      expect($location.search).toHaveBeenCalledWith('cluster', 'Any');
    });
  });
});
