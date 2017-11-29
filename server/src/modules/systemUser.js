/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let User = require('../../shared/user');
let systemUser = User.new('System', null, [], [{ Access: 'ADMIN', Resource: '**' }]);

module.exports = systemUser;
