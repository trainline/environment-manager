/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AWS = require('aws-sdk');
let memoize = require('modules/memoize');

let myIdentity = memoize(() => (new AWS.STS()).getCallerIdentity().promise());

module.exports = myIdentity;
