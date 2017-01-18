/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .factory('schemaValidatorService', function ($http, $window, $log) {
    var options = {
      allErrors: true,
      format: 'full'
    };

    $log.log('Creating JSON Schema Validator...');
    var ajv = new $window.Ajv(options);
    $log.log('Created JSON Schema Validator.');

    $log.log('Loading JSON Schemas...');
    [
      'EnvironmentType'
    ].map(load);

    // Dont't know how to ensure all the schemas are loaded before returning.
    return validator;

    function validator(schemaId) {
      var validator = ajv.getSchema(schemaId);
      return validateUsing(validator);
    }

    function addressOf(schemaId) {
      return '/schema/' + schemaId + '.schema.json';
    }

    function load(schemaId) {
      $log.log('Downloading schema ' + schemaId + '...');
      return $http.get(addressOf(schemaId))
        .then(
          function (rsp) {
            $log.log('Downloaded schema ' + schemaId);
            $log.log(rsp.data);
            return ajv.addSchema(rsp.data);
          },

          function (err) {
            $log.error('Download of schema ' + schemaId + 'failed!');
            return $log.error(err);
          });
    }

    function validateUsing(validator) {
      return function (value) {
        if (validator(value)) {
          return null;
        } else {
          var errors = validator.errors;
          return errors ? errors.map(makeErrorHumanReadable) : null;
        }
      };
    }

    function makeErrorHumanReadable(validationError) {
      return [
        'Data',
        validationError.dataPath.replace(/^\./, ''),
        validationError.message
      ].join(' ');
    }
  });
