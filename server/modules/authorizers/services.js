/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

exports.getRules = request => {

    var cluster = request.params.range;

    return Promise.resolve([{
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [cluster.toLowerCase()]
    }]);

};

exports.docs = {
    requiresClusterPermissions: true,
    requiresEnvironmentTypePermissions: false
};