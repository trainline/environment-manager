/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  name: 'images',
  type: 'ec2/image',
  perAccount: true,
  queryable: true,
  docs: {
    description: 'Image',
    tags: ['Images (AMIs)'],
  },
};
