/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/** ************************************************************************************************
 *** Be careful in using typeof check because requiring the same module using different path    ***
 *** means different objects !!!                                                                ***
 *** require('./MyContract') < different > require('MyContract')                                ***
 **************************************************************************************************/

let InvalidContractError = require('modules/errors/InvalidContractError.class');

let assertContract = function (contract, contractName, contractAssertion) {
  if (!contractAssertion) return;

  if (contract === undefined) {
    throw new InvalidContractError(`Expected "${contractName}" not to be undefined`);
  } else {
    if (contract === null && contractAssertion.null !== true) {
      throw new InvalidContractError(`Expected "${contractName}" not to be null`);
    }

    if (contractAssertion.type) {
      if (contractAssertion.type === String) {
        if (typeof contract !== 'string' && !(contract instanceof String)) {
          throw new InvalidContractError(`Expected "${contractName}" to be instance of String`);
        }
      } else if (contractAssertion.type === Boolean) {
        if (typeof contract !== 'boolean' && !(contract instanceof Boolean)) {
          throw new InvalidContractError(`Expected "${contractName}" to be instance of Boolean`);
        }
      } else if (contractAssertion.type === Number) {
        if (typeof contract !== 'number' && !(contract instanceof Number)) {
          throw new InvalidContractError(`Expected "${contractName}" to be instance of Number`);
        }
      } else if (!(contract instanceof contractAssertion.type) && contract.getType && contract.getType() != contractAssertion.type) {
        throw new InvalidContractError(`Expected "${contractName}" to be instance of ${contractAssertion.type.name}`);
      }
    }

    if (contractAssertion.empty !== true) {
      if ((contract instanceof String) && contract.trim() === '') {
        throw new InvalidContractError(`Expected "${contractName}" not to be empty`);
      }

      if ((contract instanceof Array) && !contract.length) {
        throw new InvalidContractError(`Expected "${contractName}" not to be empty`);
      }

      if ((contract instanceof Number) && !contract) {
        throw new InvalidContractError(`Expected "${contractName}" not to be empty`);
      }
    }

    if (!contractAssertion.properties) return;

    for (let property in contractAssertion.properties) {
      assertContract(
        contract[property],
        `${contractName}.${property}`,
        contractAssertion.properties[property]
      );
    }
  }
};

module.exports = assertContract;
