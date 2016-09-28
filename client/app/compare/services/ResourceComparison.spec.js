/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

describe('comparing resources', function () {

  var primaryEnvironmentItem = { key: 'item1', EnvironmentName: 'env1', Value: { prop1: 'x' } };

  var items = [
    primaryEnvironmentItem,
    { key: 'item1', EnvironmentName: 'env2', Value: { prop1: 'x' } },
    { key: 'item1', EnvironmentName: 'env3', Value: { prop1: 'y' } },
    { key: 'item2', EnvironmentName: 'env4', Value: { prop1: 'y' } },
  ];

  var comparison;
  beforeEach(module('EnvironmentManager.compare'));

  beforeEach(inject(function (ResourceComparison) {
    comparison = new ResourceComparison(items, 'env1', ['env2', 'env3', 'env4']);
  }));

  it('should only compare resources with the same key', function () {
    expect(comparison.Items.length).toBe(2);
    expect(comparison.Items[0].primary.data.key).toBe('item1');

    expect(comparison.Items[0].comparisons.env2.secondary.key).toBe('item1');
    expect(comparison.Items[0].comparisons.env2.secondary.EnvironmentName).toBe('env2');

    expect(comparison.Items[0].comparisons.env3.secondary.key).toBe('item1');
    expect(comparison.Items[0].comparisons.env3.secondary.EnvironmentName).toBe('env3');
  });

  it('should find the primary environment item', function () {
    expect(comparison.Items[0].primary.data).toBe(primaryEnvironmentItem);
  });

  it('should find no primary data when data is only present in other environments', function () {
    expect(comparison.Items[1].primary.data).toBeNull();
  });

  it('should find no data for compared environments without matching keys', function () {
    expect(comparison.Items[0].comparisons.env4.secondary).toBe(null);
  });

  it('should determine matching items in two environments to be identical', function () {
    var difference = comparison.Items[0].comparisons.env2.difference;

    expect(difference.same).toBe(true);
    expect(difference.description).toBe('Identical');
    expect(difference.showable).toBe(false);
    expect(difference.class).toBe('same');
  });

  it('should determine different items in two environments to be different and show the diff', function () {
    var difference = comparison.Items[0].comparisons.env3.difference;

    expect(difference.same).toBe(false);
    expect(difference.description).toBe('{ ... }');
    expect(difference.showable).toBe(true);
    expect(difference.class).toBe('different showable');
  });

  it('should determine compared environments without matching data to be different', function () {
    var difference = comparison.Items[0].comparisons.env4.difference;

    expect(difference.same).toBe(false);
    expect(difference.description).toBe('None');
    expect(difference.showable).toBe(false);
    expect(difference.class).toBe('different');
  });

  it('should determine items in two environments both without data to be the same', function () {
    var difference = comparison.Items[1].comparisons.env2.difference;

    expect(difference.same).toBe(true);
    expect(difference.description).toBe('None');
    expect(difference.showable).toBe(false);
    expect(difference.class).toBe('same');
  });

  it('should determine show compared item to be different if it has data and primary item does not', function () {
    var difference = comparison.Items[1].comparisons.env4.difference;

    expect(difference.same).toBe(false);
    expect(difference.description).toBe('{ ... }');
    expect(difference.class).toBe('different showable');
  });

});
