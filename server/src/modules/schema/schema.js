'use strict';

let fs = require('fs');
let path = require('path');
let Ajv = require('ajv');
let Promise = require('bluebird');

const readFile = Promise.promisify(fs.readFile);

function loadSchema(schemaId, callback) {
  return readFile(path.resolve(__dirname, `${schemaId}.json`), 'utf-8')
    .then(text => JSON.parse(text))
    .asCallback(callback);
}

const options = {
  allErrors: true,
  format: 'fast',
  loadSchema
};

const ajv = new Ajv(options);
const compileAsync = Promise.promisify(ajv.compileAsync.bind(ajv));

function validator(schemaId) {
  return getSchema(schemaId).then((validate) => {
    let test = (value) => {
      if (validate(value)) {
        return [null, value];
      } else {
        let errors = validate.errors;
        return [errors];
      }
    };

    let assert = (value) => {
      if (validate(value)) {
        return true;
      } else {
        let errors = validate.errors;
        throw new Error(JSON.stringify(errors, null, 4));
      }
    };

    return {
      assert,
      test
    };
  });
}

function getSchema(schemaId) {
  let validate = ajv.getSchema(schemaId);
  return validate
    ? Promise.resolve(validate)
    : loadSchema(schemaId).then(schema => compileAsync(schema));
}

module.exports = validator;
