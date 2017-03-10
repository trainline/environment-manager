'use strict';

exports.respond = (context) => {
  return (response) => {
    context.succeed({
      statusCode: 200,
      body: JSON.stringify(response),
      headers: {}
    });
  }
}

exports.fail = (context) => {
  return (response) => {
    context.fail({
      statusCode: 500,
      body: JSON.stringify(response),
      headers: {}
    });
  }
};
