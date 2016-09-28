/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let User = require('modules/user');
let systemUser = User.new('System', ['edit'], null, [], [{ Access: 'ADMIN', Resource: '**' }]);

module.exports = systemUser;
