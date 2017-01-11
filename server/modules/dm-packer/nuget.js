/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let xpath = require('xpath');
let dom = require('xmldom');

const namespaces = {
  atom: 'http://www.w3.org/2005/Atom',
  md: 'http://schemas.microsoft.com/ado/2007/08/dataservices/metadata',
  ds: 'http://schemas.microsoft.com/ado/2007/08/dataservices',
};

function getPackageMetadataPath(id, version) {
  return `Packages(Id='${id}',Version='${version}')`;
}

function getDownloadLink(atomDoc) {
  try {
    return select('//atom:content/@src', atomDoc)[0].value;
  } catch (e) {
    throw new Error('Could not find the download link in the NuGet package metadata document.');
  }
}

function getDependencies(atomDoc) {
  try {
    let dependencies = select('//md:properties/ds:Dependencies', atomDoc)[0].textContent;
    return parsePackageSpecs(dependencies);
  } catch (error) {
    throw new Error('Could not find the dependencies in the NuGet package metadata document.');
  }
}

function parsePackageSpecs(str) {
  const splitIntoPackageSpecs = s => s.split('|').filter(x => x);
  const parsePackageSpec = (s) => {
    let parts = s.split(':').filter(x => x);
    try {
      return { id: parts[0], version: parts[1] };
    } catch (e) {
      throw (new Error(`Could not parse package spec ${s}.`));
    }
  };

  let packages = splitIntoPackageSpecs(str).map(parsePackageSpec);
  return packages;
}

function select(query, doc) {
  let xdoc = new dom.DOMParser({ errorHandler: {} }).parseFromString(doc);
  let fn = xpath.useNamespaces(namespaces);
  return fn(query, xdoc);
}

module.exports = {
  getPackageMetadataPath,
  getDownloadLink,
  getDependencies,
  parsePackageSpecs,
};
