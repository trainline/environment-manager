/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/services';
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);

function getServicesConfig(req, res, next) {
  return dynamoHelper.getAll().then(data => res.json(data)).catch(next);
}

function getServiceConfigByName(req, res) {
  res.json({});
}

function postServicesConfig(req, res) {
  res.json();
}

function putServiceConfigByName(req, res) {
  res.json();
}

function deleteServiceConfigByName(req, res) {
  res.json();
}

module.exports = {
  getServicesConfig,
  getServiceConfigByName,
  postServicesConfig,
  putServiceConfigByName,
  deleteServiceConfigByName
};
