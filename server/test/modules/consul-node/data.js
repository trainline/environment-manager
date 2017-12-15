'use strict';

module.exports = {
  getNodesOrderedByVersion() {
    return [{
      ServiceTags: [
        'version:3.2.1'
      ]
    }, {
      ServiceTags: [
        'version:2.1.1'
      ]
    }, {
      ServiceTags: [
        'version:1.0.1']
    }];
  },
  getNodesInReverseVersionOrder() {
    return [{
      ServiceTags: [
        'version:1.0.1'
      ]
    }, {
      ServiceTags: [
        'version:2.1.1'
      ]
    }, {
      ServiceTags: [
        'version:3.2.1']
    }];
  },
  getNodesInMixedOrder() {
    return [{
      ServiceTags: [
        'version:1.0.1'
      ]
    }, {
      ServiceTags: [
        'version:3.2.1'
      ]
    }, {
      ServiceTags: [
        'version:2.1.1']
    }];
  }
};
