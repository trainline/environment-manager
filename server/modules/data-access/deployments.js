/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { getTableName: physicalTableName } = require('../awsResourceNameProvider');
let Promise = require('bluebird');
let logger = require('../logger');
let describeDynamoTable = require('./describeDynamoTable');
let { hashKeyAttributeName } = require('./dynamoTableDescription');
let { DateTimeFormatterBuilder, LocalDate, ZoneId } = require('js-joda');
let { makeWritable } = require('./dynamoItemFilter');
let dynamoTable = require('./dynamoTable');
let fp = require('lodash/fp');

const DEFAULT_SCAN_EXPRESSIONS = {
  ProjectionExpression: ['list', ', ',
    ['at', 'AccountName'],
    ['at', 'DeploymentID'],
    ['at', 'Value', 'EndTimestamp'],
    ['at', 'Value', 'EnvironmentName'],
    ['at', 'Value', 'EnvironmentType'],
    ['at', 'Value', 'Nodes'],
    ['at', 'Value', 'OwningCluster'],
    ['at', 'Value', 'RuntimeServerRoleName'],
    ['at', 'Value', 'ServerRoleName'],
    ['at', 'Value', 'ServiceName'],
    ['at', 'Value', 'ServiceSlice'],
    ['at', 'Value', 'ServiceVersion'],
    ['at', 'Value', 'StartTimestamp'],
    ['at', 'Value', 'Status'],
    ['at', 'Value', 'User']]
};

const ES_DATETIME_FORMAT = new DateTimeFormatterBuilder().appendInstant(3).toFormatter();

function factory({ archivedDeploymentsTable, archivedDeploymentsIndex, runningDeploymentsTable }) {
  let tableNames = [archivedDeploymentsTable, runningDeploymentsTable];

  function myTables() {
    return Promise.resolve(tableNames);
  }

  function create(item) {
    return describeDynamoTable(runningDeploymentsTable).then(description =>
      fp.flow(
        makeWritable,
        record => ({
          record,
          expressions: {
            ConditionExpression: ['attribute_not_exists', ['at', hashKeyAttributeName(description)]]
          }
        }),
        dynamoTable.create.bind(null, runningDeploymentsTable)
      )(item)
    );
  }

  function get(key) {
    let firstFoundOrNull = fp.flow(fp.find(x => x !== null), fp.defaultTo(null));
    return Promise.map(myTables(), tableName => dynamoTable.get(tableName, key))
      .then(firstFoundOrNull);
  }

  function scanRunning(expressions) {
    return dynamoTable.scan(runningDeploymentsTable, Object.assign({}, DEFAULT_SCAN_EXPRESSIONS, expressions));
  }

  function queryByDateRange(minInstant, maxInstant, expressions) {
    function scanArchived() {
      function next(prevKey) {
        return prevKey.minusDays(1);
      }

      let createQuery = date => ({
        IndexName: archivedDeploymentsIndex,
        KeyConditionExpression: ['and',
          ['=', ['at', 'StartDate'], ['val', date.toString()]],
          ['>=', ['at', 'StartTimestamp'], ['val', ES_DATETIME_FORMAT.format(minInstant)]]],
        Limit: 100,
        ScanIndexForward: false
      });

      function loop(table, partition, lowerBound, results) {
        let partitionContainingLowerBound = LocalDate.ofInstant(lowerBound, ZoneId.UTC);
        if (partition.isBefore(partitionContainingLowerBound)) {
          return results;
        } else {
          return dynamoTable.query(table, Object.assign({}, DEFAULT_SCAN_EXPRESSIONS, expressions, createQuery(partition)))
            .then((result) => {
              results.push(...result);
              return loop(table, next(partition), lowerBound, results);
            });
        }
      }

      let firstPartition = LocalDate.ofInstant(maxInstant, ZoneId.UTC);
      return loop(archivedDeploymentsTable, firstPartition, minInstant, [])
      .catch((error) => {
        logger.warn(error);
        return [];
      });
    }

    return Promise.join(
      scanRunning(expressions),
      scanArchived(),
      (running, archived) => [...running, ...archived]);
  }

  function update(expression) {
    return describeDynamoTable(runningDeploymentsTable).then(description =>
      fp.flow(
        ({ key, updateExpression }) => ({
          key,
          expressions: { UpdateExpression: updateExpression }
        }),
        dynamoTable.update.bind(null, runningDeploymentsTable)
      )(expression)
    );
  }

  function appendLogEntries({ key, logEntries }) {
    let updateExpression = [
      'update',
      ['set',
        ['at', 'Value', 'ExecutionLog'],
        ['list_append',
          ['at', 'Value', 'ExecutionLog'],
          ['val', logEntries]]]
    ];

    return update({
      key,
      updateExpression
    });
  }

  return {
    appendLogEntries,
    create,
    get,
    queryByDateRange,
    scanRunning,
    update
  };
}

module.exports = factory({
  archivedDeploymentsTable: physicalTableName('ConfigCompletedDeployments'),
  archivedDeploymentsIndex: 'StartDate-StartTimestamp-index',
  runningDeploymentsTable: physicalTableName('ConfigDeploymentExecutionStatus')
});
