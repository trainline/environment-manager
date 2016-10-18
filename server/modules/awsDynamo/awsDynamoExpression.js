/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function Expression(data) {
  let $this = this;

  this.data = {
    operation: data.operation,
    names: data.name.split('.'),
    value: null,
  };

  this.to = function (value) {
    $this.data.value = value;
    return $this;
  };

  this.getNames = function () {
    return $this.data.names.map((name) => (
      {
        name,
        alias: `#${name}`,
      }
    ));
  };

  this.getValue = function () {
    return $this.data.value;
  };

  this.getOperation = function () {
    return $this.data.operation;
  };

  this.getFunction = function () {
    return $this.data.function;
  };
}

function AddExpression(name) {
  let $base = new Expression({
    operation: 'add',
    name,
  });

  this.to = $base.to;
  this.getNames = $base.getNames;
  this.getOperation = $base.getOperation;
  this.getValue = $base.getValue;
}

function SetExpression(name) {
  let $base = new Expression({
    operation: 'set',
    name,
  });

  this.to = $base.to;
  this.getNames = $base.getNames;
  this.getOperation = $base.getOperation;
  this.getValue = $base.getValue;
}

module.exports = {
  Add: AddExpression,
  Set: SetExpression,
};
