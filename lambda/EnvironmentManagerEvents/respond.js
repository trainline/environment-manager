/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

exports.respond = (context) => {
  return (response) => {
    console.log('Context succeeded.');
    context.succeed({
      statusCode: 200,
      body: JSON.stringify(response),
      headers: {}
    });
  };
};

exports.fail = (context) => {
  return (response) => {
    console.log('Context failed.');
    context.fail({
      statusCode: 500,
      body: JSON.stringify(response),
      headers: {}
    });
  };
};
