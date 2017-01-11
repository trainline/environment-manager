/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let fileSystem = require('fs');
let compiler   = require('es6-template-strings/compile');
let resolver   = require('es6-template-strings/resolve-to-string');

var templateCatalog = [];

function Template(name, path) {
  var _name = name;
  var _path = path;
  var _template = null;

  function getName() { return _name; };

  function getPath() { return _path; };

  function getTemplate() { return _template; }

  function setTemplate(value) { _template = value; }

  function render(data, callback) {
    var executeTemplating = function() {
      var result = resolver(getTemplate(), data);
      callback(result);
    };

    if(getTemplate()) {
      executeTemplating();
    } else {
      fileSystem.readFile(getPath(), 'utf8', function(error, content) {
        if(error) throw error;

        setTemplate(compiler(content));
        executeTemplating();
      });
    }
  }

  return {
    render: render
  };
}

module.exports = {
  register: function(name, path) {
    templateCatalog[name] = new Template(name, path);
  },
  render: function(name, data, callback) {
    templateCatalog[name].render(data, callback);
  }
};
