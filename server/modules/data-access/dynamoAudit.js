/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function attachAuditMetadata({ record, metadata: { TransactionID, User } }) {
  let audit = Object.assign({}, record.Audit, {
    LastChanged: (new Date()).toISOString(),
    TransactionID,
    User
  });
  return Object.assign({}, record, { Audit: audit });
}

function getAuditMetadata(record) {
  return record.Audit;
}

function removeAuditMetadata(record) {
  let t = Object.assign({}, record);
  delete t.Audit;
  return t;
}

module.exports = {
  attachAuditMetadata,
  getAuditMetadata,
  removeAuditMetadata
};
