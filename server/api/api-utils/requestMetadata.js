/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let getMetadataForDynamoAudit = req => ({
  TransactionID: req.id,
  User: req.user.getName()
});

module.exports = {
  getMetadataForDynamoAudit
};
