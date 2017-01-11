/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

/**
 * This synchronises variables with query parameters using provided config.
 */
angular.module('EnvironmentManager.common').factory('QuerySync',
  function ($parse, $location) {

    function QuerySync(target, params) {
      this.target = target;
      this.params = params;
    }

    _.assign(QuerySync.prototype, {
      
      init: function () {
        var _this = this;
        _.forIn(this.params, function (obj, key) {

          var value = $location.search()[key] || obj.default;
          
          if (obj.castToInteger) {
            value = parseInt(value);
          }
          
          $parse(obj.property).assign(_this.target, value);
        });
      },

      updateQuery: function() {
        var _this = this;
        _.forIn(this.params, function (obj, key) {
          $location.search(key, $parse(obj.property)(_this.target));
        });
      },

    });

    return QuerySync;
  });
