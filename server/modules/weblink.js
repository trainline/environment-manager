'use strict';

const _ = require('lodash');
const url = require('url');

function link(links) {
  return _.map(links, (href, rel) => [`<${url.format(href)}>`, `rel="${rel}"`].join('; '))
    .join(', ');
}

module.exports = { link };
