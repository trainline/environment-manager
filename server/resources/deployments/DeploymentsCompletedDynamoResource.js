/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

module.exports = {
    name: 'deployments/completed',
    type: 'dynamodb/table',
    tableName: 'ConfigCompletedDeployments',
    keyName: 'DeploymentID',
    perAccount: true,
    queryable: true,
    dateField: {
        name: 'Value.StartTimestamp',
        format: 'ISO'
    },
    docs: {
        disableDocs: true
    }
};
