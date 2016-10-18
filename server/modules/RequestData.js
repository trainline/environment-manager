/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = function RequestData(request) {
  let data;

  this.get = function (key, defaultValue) {
    if (!data) data = getDataFromRequest(request);
    return data[key.toLowerCase()] || defaultValue;
  };

  function getDataFromRequest() {
    let dataFromRequest = {};

    for (let property in request.query) {
      dataFromRequest[property.toLowerCase()] = request.query[property];
    }

    for (let property in request.body) {
      dataFromRequest[property.toLowerCase()] = request.body[property];
    }

    return dataFromRequest;
  }
};
