'use strict';

let notImplemented = require('api/api-utils/notImplemented');
let scanDynamoAllAccounts = require('queryHandlers/ScanCrossAccountDynamoResources');
let scanDynamo = require('queryHandlers/ScanDynamoResources');
let dateUtil = require('api/api-utils/dateUtil');

/**
 * GET /audit?account=xyz
 */
function getAuditLogs(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const $date_from = req.swagger.params.since.value || dateUtil.beginningOfToday();
  const filter = { $date_from };
  const resource = 'audit';
  const exposeAudit = 'version-only';

  if (accountName !== undefined) {
    return scanDynamo({ accountName, resource, filter, exposeAudit }).then(data => res.json(data)).catch(next);
  } else {
    return scanDynamoAllAccounts({ resource, filter, exposeAudit }).then(data => res.json(data)).catch(next);
  }
}

/**
 * GET /audit/{key}
 */
function getAuditLogByKey(req, res, next) {
  notImplemented(res, 'Getting a specific audit log by key')
}

module.exports = {
  getAuditLogs,
  getAuditLogByKey
};
