/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let toggleUpstreamsAuthorizer = require('modules/authorizers/toggle-upstreams');
let toggleServicesAuthorizer = require('modules/authorizers/toggle-services');

let links = require('config').getUserValue('local').content.links;
let docsLink = links.UPSTREAMS;

module.exports = [

  route.get('/:account/environments/:environment/upstreams/:upstream/slices')
  .inOrderTo('Get active and inactive slices given an upstream name')
  .withDocs({ link: docsLink, description: 'Upstream', tags: ['Upstreams'] })
  .do((request, response) => {
    send.query({
      name: 'GetSlicesByUpstream',
      accountName: request.params.account,
      environmentName: request.params.environment,
      upstreamName: request.params.upstream,
    }, request, response);
  }),

  route.get('/:account/environments/:environment/upstreams/:upstream/slices/active')
  .inOrderTo('Get active only slices given an upstream name')
  .withDocs({ link: docsLink, description: 'Upstream', tags: ['Upstreams'] })
  .do((request, response) => {
    send.query({
      name: 'GetSlicesByUpstream',
      accountName: request.params.account,
      environmentName: request.params.environment,
      upstreamName: request.params.upstream,
      active: true
    }, request, response);
  }),

  route.get('/:account/environments/:environment/upstreams/:upstream/slices/inactive')
  .inOrderTo('Get inactive only slices given an upstream name')
  .withDocs({ link: docsLink, description: 'Upstream', tags: ['Upstreams'] })
  .do((request, response) => {
    send.query({
      name: 'GetSlicesByUpstream',
      accountName: request.params.account,
      environmentName: request.params.environment,
      upstreamName: request.params.upstream,
      active: false
    }, request, response);
  }),

  route.get('/:account/environments/:environment/services/:service/slices')
  .inOrderTo('Get active and inactive slices given environment and service name')
  .withDocs({ link: docsLink, description: 'Service', tags: ['Services'] })
  .do((request, response) => {
    send.query({
      name: 'GetSlicesByService',
      accountName: request.params.account,
      environmentName: request.params.environment,
      serviceName: request.params.service,
    }, request, response);
  }),

  route.get('/:account/environments/:environment/services/:service/slices/active')
  .inOrderTo('Get active only slices given environment and service name')
  .withDocs({ link: docsLink, description: 'Service', tags: ['Services'] })
  .do((request, response) => {
    send.query({
      name: 'GetSlicesByService',
      accountName: request.params.account,
      environmentName: request.params.environment,
      serviceName: request.params.service,
      active: true,
    }, request, response);
  }),

  route.get('/:account/environments/:environment/services/:service/slices/inactive')
  .inOrderTo('Get inactive only slices given environment and service name')
  .withDocs({ link: docsLink, description: 'Service', tags: ['Services'] })
  .do((request, response) => {
    send.query({
      name: 'GetSlicesByService',
      accountName: request.params.account,
      environmentName: request.params.environment,
      serviceName: request.params.service,
      active: false,
    }, request, response);
  }),

  route.put('/:account/environments/:environment/upstreams/:upstream/slices/toggle')
  .inOrderTo('Toggle slices status given an upstream name')
  .withDocs({ link: docsLink, description: 'Upstream', tags: ['Upstreams'] })
  .withAuthorizer(toggleUpstreamsAuthorizer)
  .do((request, response) => {
    send.command({
      name: 'ToggleSlicesByUpstream',
      accountName: request.params.account,
      environmentName: request.params.environment,
      upstreamName: request.params.upstream,
    }, request, response);
  }),

  route.put('/:account/environments/:environment/services/:service/slices/toggle')
  .inOrderTo('Toggle slices status given environment and service name')
  .withDocs({ link: docsLink, description: 'Service', tags: ['Services'] })
  .withAuthorizer(toggleServicesAuthorizer)
  .do((request, response) => {
    send.command({
      name: 'ToggleSlicesByService',
      accountName: request.params.account,
      environmentName: request.params.environment,
      serviceName: request.params.service,
    }, request, response);
  }),
];
