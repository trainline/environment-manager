/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let fp = require('lodash/fp');

module.exports = (name, req) => fp.get(['swagger', 'params', name, 'value'])(req);
