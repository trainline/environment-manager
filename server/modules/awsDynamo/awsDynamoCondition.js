/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function decodeValue(value) {
  if (typeof value !== 'string') return value;

  if ((value[0] === '"'  && value[value.length - 1] === '"') ||
     (value[0] === '\'' && value[value.length - 1] === '\''))
    return value.substring(1, value.length - 1);

  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  var number = Number(value);
  if (number) return number;

  return value;
};

function Condition(data) {
  var $this = this;

  this.data = {
    names: data.name.split('.'),
    operator: data.operator,
  };

  this.to = function (value) {
    $this.data.value = value;
    return $this;
  };

  this.than = function (value) {
    $this.data.value = value;
    return $this;
  };

  this.getNames = function () {
    return $this.data.names.map(function (name) {
      return {
        name: name,
        alias: '#' + name,
      };
    });
  };

  this.getValue = function () { return decodeValue($this.data.value); };

  this.toString = function (name, value) {
    return [name, $this.data.operator, value].join(' ');
  };
}

function BinaryCondition(name, operator) {
  var $base = new Condition({
    name: name,
    operator: operator,
  });

  this.to          = $base.to;
  this.than        = $base.than;
  this.getNames    = $base.getNames;
  this.getValue    = $base.getValue;
  this.toString    = $base.toString;
};

module.exports = {
  Equal: function (name) { return new BinaryCondition(name, '='); },

  NotEqual: function (name) { return new BinaryCondition(name, '<>'); },

  Less: function (name) { return new BinaryCondition(name, '<'); },

  LessOrEqual: function (name) { return new BinaryCondition(name, '<='); },

  Greater: function (name) { return new BinaryCondition(name, '>'); },

  GreaterOrEqual: function (name) { return new BinaryCondition(name, '>='); },
};
