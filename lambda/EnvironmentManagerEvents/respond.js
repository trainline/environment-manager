/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

exports.respond = (context) => {
  console.log('Context succeeded.');

  return (response) => {
    context.succeed({
      statusCode: 200,
      body: JSON.stringify(response),
      headers: {}
    });
  };
};

exports.fail = (context) => {
  console.log('Context failed.');

  return (response) => {
    context.fail({
      statusCode: 500,
      body: JSON.stringify(response),
      headers: {}
    });
  };
};
