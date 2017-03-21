/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let HealthCheckResults = require('../resultCodes');

module.exports = {
  url: '/ping',
  run: () => {
    return  Promise.resolve({
      result: HealthCheckResults.SUCCESS
    });
  }
};
