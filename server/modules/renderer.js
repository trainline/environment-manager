/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable */
/**
 * TODO: This file needs some attention/simplifying
 * Ignoring eslint until then.
 */
'use strict';

let fileSystem = require('fs');
let compiler = require('es6-template-strings/compile');
let resolver = require('es6-template-strings/resolve-to-string');

let templateCatalog = [];

function Template(name, path) {
  let _name = name;
  let _path = path;
  let _template = null;

  function getPath() { return _path; }

  function getTemplate() { return _template; }

  function setTemplate(value) { _template = value; }

  function render(data, callback) {
    let executeTemplating = function () {
      let result = resolver(getTemplate(), data);
      callback(result);
    };

    if (getTemplate()) {
      executeTemplating();
    } else {
      fileSystem.readFile(getPath(), 'utf8', (error, content) => {
        if (error) throw error;

        setTemplate(compiler(content));
        executeTemplating();
      });
    }
  }

  return {
    render,
  };
}

module.exports = {
  register(name, path) {
    templateCatalog[name] = new Template(name, path);
  },
  render(name, data, callback) {
    templateCatalog[name].render(data, callback);
  },
};
