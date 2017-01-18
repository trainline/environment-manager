/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular
  .module('EnvironmentManager.common')
  .directive('jsonDiffPatch',
    function ($parse) {
      return {
        restrict: 'E',
        link: function ($scope, element, attributes) {
          function getAttributeValue(attributeName) {
            var value = $parse(attributes[attributeName])($scope);
            if (typeof value !== 'string') return value;
            else return value ? JSON.parse(value) : {};
          }

          function attributeExists(attributeName) {
            return attributes[attributeName] != undefined;
          }

          var source = getAttributeValue('source');
          var target = getAttributeValue('target');
          var options = getAttributeValue('options');
          var changedOnly = attributeExists('changedOnly');

          var delta = jsondiffpatch.create(options).diff(source, target);
          var content = null;

          var pre = document.createElement('pre');

          if (delta) {
            content = jsondiffpatch.formatters.html.format(delta, source);

            if (changedOnly) jsondiffpatch.formatters.html.hideUnchanged(pre);
            else jsondiffpatch.formatters.html.showUnchanged(pre);
          } else {
            content = changedOnly
              ? 'Identical'
              : JSON.stringify(source, null, '  ');
          }


          pre.innerHTML = content;

          element[0].appendChild(pre);
        }
      };
    }

  );
