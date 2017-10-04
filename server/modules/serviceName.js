'use strict';

const environmentQualifiedNameRegex = /^([^-]+)-([^-]+)(?:-([^-]+))?$/;

function validate(required, regexp, name, value) {
  if (!required && (value === null || value === undefined)) {
    return;
  }
  if (!(typeof value === 'string' && regexp.test(value))) {
    throw new Error(`${required ? 'Required' : 'Optional'} argument "${name}" must be a string matching ${regexp}`);
  }
}

let formatSlice = slice => (slice !== undefined && slice !== null && slice !== 'none' ? `-${slice}` : '');

let validateOptional = validate.bind(null, false);
let validateRequired = validate.bind(null, true);

function format(environment, service, slice) {
  validateRequired(/^[^-]+$/, 'environment', environment);
  validateRequired(/^[^-]+$/, 'service', service);
  validateOptional(/^[^-]+$/, 'slice', slice);
  return `${environment}-${service}${formatSlice(slice)}`;
}

function formatSQN(service, slice) {
  validateRequired(/^[^-]+$/, 'service', service);
  validateOptional(/^[^-]+$/, 'slice', slice);
  return `${service}${formatSlice(slice)}`;
}

function parse(environmentQualifiedName) {
  let match = environmentQualifiedNameRegex.exec(environmentQualifiedName);
  if (match === null) {
    throw new Error(`Environment-qualified service name must match ${environmentQualifiedNameRegex}: ${environmentQualifiedName}`);
  } else {
    let [, environment, service, slice] = match;
    return Object.assign({ environment, service }, slice === undefined || /^none$/i.test(slice) ? {} : { slice });
  }
}

module.exports = {
  format,
  formatSQN,
  parse
};
