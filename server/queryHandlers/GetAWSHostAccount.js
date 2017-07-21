/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let myIdentity = require('modules/amazon-client/myIdentity');

module.exports = () => {
  return myIdentity().then(ident => ({ id: Number(ident.Account) }));
};
