/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function Cleanup(command, actionDefinitions) {

  var executeCommand = function () {

    var actionDefinition = getActionDefinition();
    if (!actionDefinition) return;

    if(!validateActionDefinition(actionDefinition)) return;

    actionDefinition.do(command.parameters, (error, response, body) => {

      if (error) throw error;

      if (response.statusCode !== 200) {

        console.log(`Action has failed. Status ${response.statusCode}: ${response.statusMessage}`);

      } else {

        console.log("Action succeeded removing following keys: ", JSON.parse(body));

      }

    });

  };

  var getActionDefinition = function () {

    var actionDefinition =  actionDefinitions.filter(actionDefinition =>
      actionDefinition.action === command.action
    )[0];

    if (actionDefinition) return actionDefinition;

    showHelp(`Provided command "cleanup ${command.action}" is invalid.`);

  };

  var validateActionDefinition = function (actionDefinition) {
    
    var missingParameter = actionDefinition.parameters.filter(parameter =>
      parameter.optional !== true && !command.parameters[parameter.name]
    )[0];

    if (missingParameter) {
      showHelp(`Parameter "${missingParameter.name}" is required.`);
      return false;      
    }

    for (var parameterName in command.parameters) {

      if (actionDefinition.parameters.some(x => x.name === parameterName)) continue;
      
      showHelp(`Unknown parameter "${parameterName}".`);
      return false;          
    }

    return true;
  };

  var showHelp = function (reason) {

    console.log(reason);
    console.log();

    actionDefinitions.forEach(actionDefinition => {

      console.log(`cleanup ${actionDefinition.action}: ${actionDefinition.description}`);
      
      actionDefinition.parameters.forEach(parameter => {

        console.log(parameter.optional
          ? `  - ${parameter.name}: ${parameter.description} (optional)`
          : `  - ${parameter.name}: ${parameter.description}`
        );

      });

      console.log();

    });

  };

  executeCommand();

};

return new Cleanup(
  require("./command"),
  require("./actionDefinitions")
);
