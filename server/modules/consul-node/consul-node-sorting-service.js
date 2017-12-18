'use strict';

const semver = require('semver-sort');

class ConsulNodeSortingService {
  static getOrderedNodesDesc(nodes) {
    return [...nodes].sort((a, b) => {
      const ordered = semver.desc([a.getServiceVersion(), b.getServiceVersion()]);
      const higher = ordered[0];
      const lower = ordered[1];
      let val = 0;

      if (higher === a.getServiceVersion() && higher === b.getServiceVersion()) val = 0;
      if (higher === a.getServiceVersion() && lower === b.getServiceVersion()) val = -1;
      if (higher === b.getServiceVersion() && lower === a.getServiceVersion()) val = 1;

      return val;
    });
  }

  static convertToJson(consulNodes = []) {
    return consulNodes.map(x => x.getJson());
  }
}

module.exports = {
  ConsulNodeSortingService
};
