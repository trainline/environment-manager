/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  name: 'instances',
  type: 'ec2/instance',
  perAccount: true,
  queryable: true,
  docs: {
    description: 'Instance',
    tags: ['Instances'],
  },
};
