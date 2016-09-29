'use strict';

let getAllServices = require('queryHandlers/services/GetAllServices');
let getService = require('queryHandlers/services/GetService');
let getSlices = require('queryHandlers/slices/GetSlicesByService');
let getActiveSlices = require('queryHandlers/slices/GetActiveSlicesByService');
let getInactiveSlices = require('queryHandlers/slices/GetInactiveSlicesByService');
let toggleService = require('commands/slices/ToggleSlicesByService');

/**
 * GET /services?environment=a,b,c
 */
function getServices(req, res, next) {
  const environment = req.swagger.params.environment.value;

  return getAllServices({ environment }).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}?environment=a,b,c
 */
function getServiceById(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  return getService({ environment, serviceName }).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}/slices?environment=a&active=true
 */
function getServiceSlices(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const active = req.swagger.params.active.value;

  if (active === undefined) {
    return getSlices({ environmentName, serviceName }).then(data => res.json(data)).catch(next);
  } else if (active === true) {
    return getActiveSlices({ environmentName, serviceName }).then(data => res.json(data)).catch(next);
  } else {
    return getInactiveSlices({ environmentName, serviceName }).then(data => res.json(data)).catch(next);
  }
}

/**
 * PUT /services/{service}/toggle
 */
function putServiceSlicesToggle(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const user = req.user;

  return toggleService({ environmentName, serviceName, user }).then(data => res.json(data)).catch(next);
}

module.exports = {
  getServices,
  getServiceById,
  getServiceSlices,
  putServiceSlicesToggle
};
