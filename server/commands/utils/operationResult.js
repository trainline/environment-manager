/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let CREATED_RESOURCES = 'created-resources';
let UPDATED_RESOURCES = 'updated-resources';
let DELETED_RESOURCES = 'deleted-resources';

function OperationResult(data) {
  let $this = this;

  $this[CREATED_RESOURCES] = [];
  $this[UPDATED_RESOURCES] = [];
  $this[DELETED_RESOURCES] = [];

  $this.createdResource = function (uri) {
    $this[CREATED_RESOURCES].push(uri);
  };

  $this.updatedResource = function (uri) {
    $this[UPDATED_RESOURCES].push(uri);
  };

  $this.deletedResource = function (uri) {
    $this[DELETED_RESOURCES].push(uri);
  };

  $this.add = function (childResult) {
    if (!childResult) return $this;

    if (Object.prototype.toString.call(childResult) === '[object Array]') {
      childResult.forEach($this.add);
    } else {
      childResult[CREATED_RESOURCES].forEach($this.createdResource);
      childResult[UPDATED_RESOURCES].forEach($this.updatedResource);
      childResult[DELETED_RESOURCES].forEach($this.deletedResource);
    }

    return $this;
  };

  if (data) {
    if (data.created) data.created.forEach($this.createdResource);
    if (data.updated) data.updated.forEach($this.updatedResource);
    if (data.deleted) data.deleted.forEach($this.deletedResource);
  }
}

OperationResult.resourceUri = function (resource, key, range) {
  let segments = resource.split('/');
  if (key) segments.push(key);
  if (range) segments.push(range);

  return `/${segments.join('/')}/`;
};

module.exports = OperationResult;
