/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let route = require('modules/helpers/route');
let pluralize = require('pluralize');
let config = require('config');
let _ = require('lodash');

const IS_PROD = config.get('IS_PRODUCTION');

module.exports = route
  .get('/swagger.json')
  .inOrderTo('Describe all available API endpoints.')
  .do((request, response) => {

    function getParams(url, docs) {
      var r = /\/:([^/]*)/g,
        matches,
        parameters = [];

      while (matches = r.exec(url)) {
        parameters.push({ in: 'path',
          name: matches[1],
          type: 'string',
          required: true,
        });
      }

      if (docs && docs.params) {
        docs.params.forEach(function (docParam) {
          _.remove(parameters, function (urlParam) {
            return urlParam.name == docParam.name;
          });

          parameters.push(docParam);
        });
      }

      return parameters;
    }

    function getRouteDescription(route) {
      var verb = route.docs.verb || route.method;
      var perAccount = route.docs.perAccount ? ' within an account' : '';

      switch (verb) {
        case 'scan':
          return `List all ${pluralize(route.docs.description)}${perAccount}`;
        case 'crossScan':
          return `List all ${pluralize(route.docs.description)} in all accounts`;
        case 'get':
          return `Get a particular ${route.docs.description}${perAccount}`;
        case 'put':
          return `Update a particular ${route.docs.description}${perAccount}`;
        case 'delete':
          return `Delete a particular ${route.docs.description}${perAccount}`;
        case 'post':
          return `Create a new ${route.docs.description}${perAccount}`;
        case 'replace':
          return `Import (replace) ${pluralize(route.docs.description)}${perAccount}`;
        case 'merge':
          return `Import (merge) ${pluralize(route.docs.description)}${perAccount}`;
        case 'export':
          return `Export ${pluralize(route.docs.description)}${perAccount}`;
      }
    }

    function getSummaryFromRoute(route) {
      if (route.reason) return route.reason;
      if (route.docs) return getRouteDescription(route);
      return 'Todo';
    }

    function getDescription(summary, route) {
      var description = summary;
      if (route.authorizer) {
        if (route.authorizer.docs.requiresClusterPermissions) {
          description += '<br><br>Cluster permissions are required to call this endpoint';
        }

        if (route.authorizer.docs.requiresEnvironmentTypePermissions) {
          description += '<br><br>Environment type permissions are required to call this endpoint';
        }
      }

      if (route.docs && route.docs.link) {
        description += "<br><br>For more information please visit:<br><a href='" + route.docs.link + "'>" + route.docs.link + '</a>';
      }

      return description;
    }

    function getPathsFromRoutes(routes) {
      var paths = {};
      routes.forEach(route => {

        var summary = getSummaryFromRoute(route);
        var definition = {
          summary: summary,
          description: getDescription(summary, route),
          responses: {
            200: {
              description: 'Success',
            },
            500: {
              description: 'Unexpected error',
            },
          },
        };

        definition.tags = route.docs && route.docs.tags ? route.docs.tags : ['Other'];

        var params = getParams(route.url, route.docs);

        var url = route.url;
        params.forEach(function (param) {
          url = url.replace(`:${param.name}`, `{${param.name}}`);
        });
        
        if (route.parameters !== undefined) params = params.concat(route.parameters);
        if (params.length > 0) definition.parameters = params;

        if (route.consumes) definition.consumes = route.consumes;

        if (paths[url]) {
          paths[url][route.method] = definition;
        } else {
          var path = {};
          path[route.method] = definition;
          paths[url] = path;
        }

      });
      return paths;
    }

    let routeHandlerProvider = require('modules/routeHandlerProvider');
    var routes = routeHandlerProvider.get().filter(route => {
      if (route.docs) return !route.docs.disableDocs;
      return true;
    });

    //Allow HTTP calls to API when running locally
    let schemes = IS_PROD ? ['https'] : ['http'];

    var swagger = {
      swagger: '2.0',
      info: {
        title: 'Environment Manager API',
      },
      schemes: schemes,
      basePath: '/api',
      produces: [
        'application/json',
      ],
      paths: getPathsFromRoutes(routes),
    };

    response.send(swagger);
  });
