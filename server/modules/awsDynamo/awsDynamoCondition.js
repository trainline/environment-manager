/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function decodeValue(value) {
  if (typeof value !== 'string') return value;

  if ((value[0] === '"' && value[value.length - 1] === '"') ||
     (value[0] === '\'' && value[value.length - 1] === '\'')) {
    return value.substring(1, value.length - 1);
  }

  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  let number = Number(value);
  if (number) return number;

  return value;
}

function Condition(data) {
  let $this = this;

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
    return $this.data.names.map(name => ({
      name,
      alias: `#${name}`,
    }));
  };

  this.getValue = function () {
    return decodeValue($this.data.value);
  };

  this.toString = function (name, value) {
    return [name, $this.data.operator, value].join(' ');
  };
}

function BinaryCondition(name, operator) {
  let $base = new Condition({
    name,
    operator,
  });

  this.to = $base.to;
  this.than = $base.than;
  this.getNames = $base.getNames;
  this.getValue = $base.getValue;
  this.toString = $base.toString;
}

function Equal(name) {
  return new BinaryCondition(name, '=');
}

function NotEqual(name) {
  return new BinaryCondition(name, '<>');
}

function Less(name) {
  return new BinaryCondition(name, '<');
}

function LessOrEqual(name) {
  return new BinaryCondition(name, '<=');
}

function Greater(name) {
  return new BinaryCondition(name, '>');
}

function GreaterOrEqual(name) {
  return new BinaryCondition(name, '>=');
}

module.exports = {
  Equal,
  NotEqual,
  Less,
  LessOrEqual,
  Greater,
  GreaterOrEqual,
};
