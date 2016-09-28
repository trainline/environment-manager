"use strict";

let Ajv = require("ajv");

function loadSchema(schemaId) {
  return require(`./${schemaId}`);
}

const options = {
  allErrors: true,
  format: "fast",
  loadSchema: (uri, callback) => {
    try {
      let schema = loadSchema(uri);
      if (schema) {
        callback(null, schema);
      } else {
        callback(new Error(`Could not find schema ${uri}.`));
      }
    } catch (error) {
      callback(error);
    }
  }
};

const ajv = new Ajv(options);

function validator(schemaId) {
  return getSchema(schemaId).then(validate => {
    let conform = (value, callback) => {
      if (validate(value)) {
        return true;
      } else {
        let errors = validate.errors;
        if (callback) {
          callback(errors);
        } else {
          throw new Error(JSON.stringify(errors, null, 4));
        }
        return false;
      }
    };

    return {
      conform: conform
    };
  });
}

function getSchema(schemaId) {
  let validate = ajv.getSchema(schemaId);
  if (validate) {
    return Promise.resolve(validate);
  } else {
    return new Promise((resolve, reject) => {
      let rawSchema = loadSchema(schemaId);
      ajv.addSchema(rawSchema);
      ajv.compileAsync(rawSchema, (error, schema) => {
        if (error) {
          reject(error);
        }
        else {
          // ajv.addSchema(schema);
          resolve(schema);
        }
      });
    });
  }
}

module.exports = validator;
