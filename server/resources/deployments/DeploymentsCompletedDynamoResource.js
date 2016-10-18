module.exports = {
  name: 'deployments/completed',
  type: 'dynamodb/table',
  tableName: 'ConfigCompletedDeployments',
  keyName: 'DeploymentID',
  perAccount: true,
  queryable: true,
  dateField: {
    name: 'Value.StartTimestamp',
    format: 'ISO',
  },
  docs: {
    disableDocs: true,
  },
};
