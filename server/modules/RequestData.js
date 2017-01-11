/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

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
      if ({}.hasOwnProperty.call(request.query, property)) {
        dataFromRequest[property.toLowerCase()] = request.query[property];
      }
    }

    for (let property in request.body) {
      if ({}.hasOwnProperty.call(request.body, property)) {
        dataFromRequest[property.toLowerCase()] = request.body[property];
      }
    }

    return dataFromRequest;
  }
};
