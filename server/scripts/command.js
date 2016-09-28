"use strict";

function getAction() {

  return process.argv[2];

}

function getParameters() {

  var result = { };

  process.argv.slice(3).forEach(arg => {

    var keyValue = arg.split("=");

    var key = keyValue[0].toLowerCase();
    if (!key) return;

    var value = keyValue[1] || null;

    result[key] = value;

  });

  return result;

}

module.exports = {
  action: getAction(),
  parameters: getParameters()
};