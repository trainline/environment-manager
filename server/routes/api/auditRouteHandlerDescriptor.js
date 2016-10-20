'use strict';

/* eslint-disable import/no-extraneous-dependencies */
const auditLogReader = require('modules/auditLogReader');
const base64 = require('modules/base64');
const logger = require('modules/logger');
const route = require('modules/helpers/route');
const weblink = require('modules/weblink');
/* eslint-enable import/no-extraneous-dependencies */

const fp = require('lodash/fp');
const Instant = require('js-joda').Instant;
const LocalDate = require('js-joda').LocalDate;
const ZoneOffset = require('js-joda').ZoneOffset;
const url = require('url');


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
  logger.debug('Audit History: Creating filter.');
  let exprs = {
    'Entity.Type': val => ['=', ['attr', 'Entity', 'Type'], ['val', val]],
    'ChangeType': val => ['=', ['attr', 'ChangeType'], ['val', val]],
    'Entity.Key': val => ['=', ['attr', 'Entity', 'Key'], ['val', val]],
  };

  let filter = fp.flow(
    fp.pick(fp.keys(exprs)),
    fp.toPairs,
    fp.map(x => exprs[x[0]](x[1])),
    predicates => (predicates.length > 0 ? ['and'].concat(predicates) : undefined));

  return filter(query);
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
    .do((request, response, next) => {
      let redirectUrl = url.parse(request.originalUrl, true);
      redirectUrl.search = null;
      let query = redirectUrl.query;
      let now = LocalDate.now(ZoneOffset.UTC);

      function paramOrDefault(param, fn, defaultValue) {
        function f(x) {
          try {
            fn(x);
          } catch (error) {
            logger.error(error);
            throw new Error(`Error parsing parameter: ${param}`);
          }
        }
        let t = fp.has(param)(query) ? fp.flow(fp.get(param), f)(query) : defaultValue;
        return t;
      }

      logger.debug('Audit History: Extracting parameters from request.');
      let minDate = paramOrDefault('minDate', parseDate, now);
      let maxDate = paramOrDefault('maxDate', parseDate, now);
      let exclusiveStartKey = paramOrDefault('exclusiveStartKey', base64.decode, undefined);
      function sendResponse(auditLog) {
        logger.debug('Audit History: Constructing navigation links');
        query.minDate = minDate.toString();
        query.maxDate = maxDate.toString();
        if (auditLog.LastEvaluatedKey) {
          query.exclusiveStartKey = base64.encode(auditLog.LastEvaluatedKey);
          response.header('Link', weblink.link({ next: url.format(redirectUrl) }));
        }
        logger.debug('Audit History: sending response');
        return response.status(200).send(auditLog.Items);
      }

      let filter = createFilter(query);
      let auditLogQuery = createAuditLogQuery(minDate, maxDate, exclusiveStartKey, query.per_page, filter);
      return auditLogReader.getLogs(auditLogQuery)
        .then(sendResponse).catch(next);
    }),
];
