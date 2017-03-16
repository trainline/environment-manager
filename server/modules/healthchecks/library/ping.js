/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let SUCCESS = require('../resultCodes').SUCCESS;

module.exports = {
  url: '/ping',
  run: () => {
    return Promise.resolve({
      result: SUCCESS
    });
  }
}