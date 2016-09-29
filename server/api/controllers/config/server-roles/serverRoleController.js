/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function getServerRoleByName(req, res) {
  res.json([{},{},{}]);
}

function postServerRole(req, res) {
  res.json({});
}

function putServerRoleByName(req, res) {
  res.json();
}

function deleteServerRoleByName(req, res) {
  res.json();
}

module.exports = {
  getServerRoleByName,
  postServerRole,
  putServerRoleByName,
  deleteServerRoleByName
};
