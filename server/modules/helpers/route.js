/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');

function RouteHandlerDescriptorBuilder(verb, url) {
  assert(verb);
  assert(url);

  let $this = this;

  let $name = null;
  let $verb = verb;
  let $url = url;
  let $priority = null;
  let $roles = [];
  let $validation = null;
  let $action = null;
  let $reason = null;
  let $authorizer = null;
  let $docs = null;
  let $allowsAnonymous = false;
  let $consumes = [];
  let $parameters = [];

  $this.withPriority = function (priority) {
    assert(priority);

    $priority = priority;
    return $this;
  };

  $this.withAuthorizer = function (authorizer) {
    $authorizer = authorizer;
    return $this;
  };

  $this.allowAnonymous = function () {
    $allowsAnonymous = true;
    return $this;
  };

  $this.whenUserCan = function (role) {
    assert(role);
    assert.equal(typeof role, 'string');

    $roles.push(role);
    return $this;
  };

  $this.withDocs = function (docs) {
    $docs = docs;
    return $this;
  };

  $this.inOrderTo = function (reason) {
    assert(reason);
    assert.equal(typeof reason, 'string');

    $reason = reason;
    return $this;
  };

  $this.whenRequest = function (validation) {
    assert.equal(typeof validation, 'function');

    $validation = validation;
    return $this;
  };

  $this.named = function (name) {
    assert(name);
    assert.equal(typeof name, 'string');

    $name = name;
    return $this;
  };

  $this.consumes = function (consumable) {
    $consumes.push(consumable);
    return $this;
  };

  $this.parameters = function (param) {
    $parameters.push(param);
    return $this;
  };

  $this.do = function (action) {
    assert.equal(typeof action, 'function');

    $action = action;

    let result = {
      $name,
      method: $verb,
      url: $url,
      action: $action,
      allowsAnonymous: $allowsAnonymous,
    };

    if ($roles.length) result.roles = $roles;
    if ($validation) result.validation = $validation;
    if ($priority) result.priority = $priority;
    if ($reason) result.reason = $reason;
    if ($authorizer) result.authorizer = $authorizer;
    if ($docs) result.docs = $docs;
    if ($consumes.length) result.consumes = $consumes;
    if ($parameters.length) result.parameters = $parameters;

    return result;
  };
}

module.exports = {
  get(url) {
    return new RouteHandlerDescriptorBuilder('GET', url);
  },

  put(url) {
    return new RouteHandlerDescriptorBuilder('PUT', url);
  },

  post(url) {
    return new RouteHandlerDescriptorBuilder('POST', url);
  },

  delete(url) {
    return new RouteHandlerDescriptorBuilder('DELETE', url);
  },
};
