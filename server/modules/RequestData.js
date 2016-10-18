/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = function RequestData(request) {
  let _data;

  this.get = function (key, defaultValue) {
    if (!_data) _data = getDataFromRequest(request);
    let value = _data[key.toLowerCase()] || defaultValue;
    return value;
  };

  function getDataFromRequest() {
    let data = {};

    for (let property in request.query) {
      data[property.toLowerCase()] = request.query[property];
    }

    for (let property in request.body) {
      data[property.toLowerCase()] = request.body[property];
    }

    return data;
  }
};
