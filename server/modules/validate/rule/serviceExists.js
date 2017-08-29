/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let log = require('modules/logger');
let servicesDb = require('modules/data-access/services');

/* Returns an error in the format specified at http://jsonapi.org/format/#errors
 * if the service does not exist.
 */
function serviceExists(service) {
  let serviceNotFound = () => ({
    title: 'Service Not Found',
    detail: `service name: ${service}`
  });
  return servicesDb.get({ ServiceName: service })
    .then((rsp => (rsp ? [] : serviceNotFound())),
    (err) => {
      log.warn(err);
      return serviceNotFound();
    });
}

module.exports = serviceExists;
