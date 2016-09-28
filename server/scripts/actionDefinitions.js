let request = require("request");
const host = "http://localhost";
const port = 3000;

module.exports = [
  {
    action: "environment",
    description: "clean all service and roles for a specific environment",
    parameters: [
      {
        name: "environment-name",
        description: "name of the environment to cleanup"
      }
    ],
    do: (parameters, callback) => {
      var environment = parameters["environment-name"];
      var url = `${host}:${port}/environments/${environment}`;

      request.delete(url, callback);
    }    
  },
  {
    action: "role",
    description: "clean all service for a specific server role",
    parameters: [
      {
        name: "environment-name",
        description: "name of the environment to cleanup"
      },
      {
        name: "role-name",
        description: "name of the server role to cleanup"
      },
      {
        name: "role-slice",
        description: "color of the slice to cleanup (blue|green)",
        optional: true
      }
    ],
    do: (parameters, callback) => {
      var environment = parameters["environment-name"];
      var role = parameters["role-name"];
      var slice = parameters["role-slice"];
      var url = slice 
        ? `${host}:${port}/environments/${environment}/roles/${role}/${slice.toLowerCase()}`
        : `${host}:${port}/environments/${environment}/roles/${role}`;

      request.delete(url, callback);
    }       
  },
  {
    action: "service",
    description: "clean a specific service",
    parameters: [
      { 
        name: "environment-name",
        description: "name of the environment to cleanup"
      },
      {
        name: "service-name",
        description: "name of the service to cleanup"
      },
      {
        name: "service-version",
        description: "specific version service to cleanup",
        optional: true
      }
    ],
    do: (parameters, callback) => {
      var environment = parameters["environment-name"];
      var service = parameters["service-name"];
      var version = parameters["service-version"];
      var url = version 
        ? `${host}:${port}/environments/${environment}/services/${service}/${version}`
        : `${host}:${port}/environments/${environment}/services/${service}`;

      request.delete({url: url}, callback);
    }     
  }  
];