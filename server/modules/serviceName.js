'use strict';

function format(environment, service, slice) {
  function validate(required, regexp, name, value) {
    if (!required && (value === null || value === undefined)) {
      return;
    }
    if (!(typeof value === 'string' && regexp.test(value))) {
      throw new Error(`${required ? 'Required' : 'Optional'} argument "${name}" must be a string matching ${regexp}`);
    }
  }

  let validateOptional = validate.bind(null, false);
  let validateRequired = validate.bind(null, true);
  validateRequired(/^[^-]+$/, 'environment', environment);
  validateRequired(/^[^-]+$/, 'service', service);
  validateOptional(/^[^-]+$/, 'slice', slice);
  let formatSlice = s => (s !== undefined && s !== null && s !== 'none' ? `-${slice}` : '');
  return `${environment}-${service}${formatSlice(slice)}`;
}

module.exports = {
  format
};
