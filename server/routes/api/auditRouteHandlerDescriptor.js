'use strict';

const auditLogReader = require('modules/auditLogReader');
const base64 = require('modules/base64');
const Instant = require('js-joda').Instant;
const LocalDate = require('js-joda').LocalDate;
const ZoneOffset = require('js-joda').ZoneOffset;
const route = require('modules/helpers/route');
const url = require('url');
const weblink = require('modules/weblink');

function createAuditLogQuery(minDate, maxDate, exclusiveStartKey, perPage, filter) {
  let rq = {
    limit: perPage || 10,
    maxDate: maxDate.toString(),
    minDate: minDate.toString(),
  };
  if (exclusiveStartKey) {
    rq.exclusiveStartKey = exclusiveStartKey;
  }
  if (filter) {
    rq.filter = filter;
  }
  return rq;
}

function parseDate(str) {
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(str)) {
    return LocalDate.parse(str);
  } else {
    return LocalDate.ofInstant(Instant.parse(str), ZoneOffset.UTC);
  }
}

function createFilter(query) {
  let predicates = [];
  if (query.hasOwnProperty('Entity.Type')) {
    predicates.push(['=', ['attr', 'Entity', 'Type'], ['val', query['Entity.Type']]]);
  }
  if (query.hasOwnProperty('ChangeType')) {
    predicates.push(['=', ['attr', 'ChangeType'], ['val', query['ChangeType']]]);
  }
  if (query.hasOwnProperty('Entity.Key')) {
    predicates.push(['=', ['attr', 'Entity', 'Key'], ['val', query['Entity.Key']]]);
  }
  return (predicates.length > 0) ? ['and'].concat(predicates) : undefined;
}

/* Get audit log entries in reverse order of occurrence.
 *
 * Public API Query Parameters
 * $minDate: A date in ISO 8601 format - return entries before the UTC midnight following this date.
 * per_page: integer - number of entries per page.
 *
 * Paging
 * next link in HTTP header (https://tools.ietf.org/html/rfc5988)
 *
 * Response
 * Array of audit log entries.
 * */
module.exports = [
  route.get('/all/audit').whenUserCan('view')
    .withDocs({ disableDocs: false })
    .do((request, response) => {
      let redirectUrl = url.parse(request.originalUrl, true);
      redirectUrl.search = null;
      let query = redirectUrl.query;
      let now = LocalDate.now(ZoneOffset.UTC);
      let minDate = query.hasOwnProperty('minDate') ? parseDate(query.minDate) : now;
      let maxDate = query.hasOwnProperty('maxDate') ? parseDate(query.maxDate) : now;
      let exclusiveStartKey = query.hasOwnProperty('exclusiveStartKey') ? base64.decode(query.exclusiveStartKey) : undefined;
      function sendResponse(auditLog) {
        query.minDate = minDate.toString();
        query.maxDate = maxDate.toString();
        if (auditLog.LastEvaluatedKey) {
          query.exclusiveStartKey = base64.encode(auditLog.LastEvaluatedKey);
          response.header('Link', weblink.link({ next: url.format(redirectUrl) }));
        }
        return response.status(200).send(auditLog.Items);
      }

      let filter = createFilter(query);
      let auditLogQuery = createAuditLogQuery(minDate, maxDate, exclusiveStartKey, query.per_page, filter);
      return auditLogReader.getLogs(auditLogQuery)
        .then(sendResponse);
    }),
];
