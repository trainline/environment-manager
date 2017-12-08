'use strict';

const assert = require('assert');
const data = require('./data');
const { ConsulNodeSortingService } = require('../../../modules/consul-node/consul-node-sorting-service');
const { ConsulNode } = require('../../../modules/consul-node/consul-node');

describe.only('Consul Node Sorting Service', () => {
  it('should return an ordered (desc) list of consul nodes based on version tag', () => {
    let checks = [
      data.getNodesOrderedByVersion,
      data.getNodesInReverseVersionOrder,
      data.getNodesInReverseVersionOrder
    ];

    let expected = data.getNodesOrderedByVersion;

    checks.forEach((check) => {
      let jsonNodes = check();
      let nodes = jsonNodes.map(x => new ConsulNode(x));
      let ordered = ConsulNodeSortingService.getOrderedNodesDesc(nodes);
      let jsonComparable = ConsulNodeSortingService.convertToJson(ordered);

      assert.deepEqual(jsonComparable, expected());
    });
  });
});
