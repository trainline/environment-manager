'use strict';

let fp = require('lodash/fp');

function getCanonicalUpstreamKey(environment, service) {
  return `/${environment}_${getCanonicalUpstreamName(environment, service)}/config`;
}

function getCanonicalUpstreamName(environment, service) {
  return `${environment}-${service}`;
}

function getCatalogService(hostPredicate, upstream) {
  return fp.flow(
    fp.get('Hosts'),
    fp.filter(h => h !== null && h !== undefined && h.State === 'up'),
    fp.map(h => h.DnsName),
    fp.uniq,
    (slices) => {
      if (slices.length === 1) {
        return [null, slices[0]];
      } else {
        return [`Expected one active slice but found ${slices.length}: upstream=${upstream.Key}`, null];
      }
    }
  )(upstream);
}

let getActiveCatalogService = getCatalogService.bind(null, ({ State }) => State === 'up');
let getInactiveCatalogService = getCatalogService.bind(null, ({ State }) => State !== 'up');

module.exports = {
  getActiveCatalogService,
  getInactiveCatalogService,
  getCanonicalUpstreamKey,
  getCanonicalUpstreamName
};
