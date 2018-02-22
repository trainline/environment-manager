/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let getSlices = require('../../../queryHandlers/slices/GetSlicesByUpstream');
let toggleSlices = require('../../../commands/slices/ToggleSlicesByUpstream');
let metadata = require('../../../commands/utils/metadata');
const sns = require('../../../modules/sns/EnvironmentManagerEvents');

/**
 * GET /upstreams/{name}/slices
 */
function getUpstreamSlices(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;
  const active = req.swagger.params.active.value;

  return getSlices({ environmentName, upstreamName, active })
    .then(data => res.json(data))
    .catch(next);
}

/**
 * PUT /upstreams/{name}/slices/toggle
 */
function putUpstreamSlicesToggle(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const activeSlice = req.swagger.params.active.value;
  const environmentName = req.swagger.params.environment.value;
  const user = req.user;

  const command = metadata.addMetadata({ environmentName, upstreamName, activeSlice, user });
  return toggleSlices(command)
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/upstreams/${upstreamName}/slices/toggle`,
          Method: 'PUT',
          Parameters: [
            {
              Name: 'upstream',
              Type: 'path',
              Value: upstreamName || ''
            },
            {
              Name: 'environment',
              Type: 'query',
              Value: environmentName || ''
            },
            {
              Name: 'active',
              Type: 'query',
              Value: activeSlice || ''
            }
          ]
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: upstreamName,
        Environment: environmentName,
        ActiveSlice: activeSlice
      }
    }))
    .catch(next);
}

module.exports = {
  getUpstreamSlices,
  putUpstreamSlicesToggle
};
