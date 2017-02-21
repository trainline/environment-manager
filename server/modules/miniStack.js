/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/**
 * Remove verbose stuff from stack traces
 */

const NOT_MY_CODE_REGEXP = /node_modules/;
const FILE_LOCATION_REGEXP = /\((.*)(:[0-9]+:[0-9]+)\)/;

let isMyCode = line => !NOT_MY_CODE_REGEXP.test(line);

let enteredMyCode = (line, prev) => isMyCode(line) && !isMyCode(prev);
let exitedMyCode = (line, prev) => !isMyCode(line) && isMyCode(prev);
let inMyCode = (line, prev) => isMyCode(line) && isMyCode(prev);
let inOtherCode = (line, prev) => !isMyCode(line) && !isMyCode(prev);

function create({ filePathTransform }) {
  function shorten(line) {
    return line.replace(FILE_LOCATION_REGEXP, (match, fullPath, location) => {
      let file = filePathTransform(fullPath);
      return `(${file}${location})`;
    });
  }

  function minimize(stack) {
    let lines = stack.split('\n').filter(line => !/^\s*$/.test(line));
    function loop({ context, omittedCount, output, prev }, line) {
      if (enteredMyCode(line, prev)) {
        let omitted = omittedCount > 2 ? [line.replace(/at.*/, `...(${omittedCount - 2} lines skipped)...`)] : [];
        return {
          context: [],
          omittedCount: 0,
          output: output.concat(omitted, context.map(shorten), shorten(line)),
          prev: line
        };
      } else if (exitedMyCode(line, prev)) {
        return {
          context: [],
          omittedCount: 1,
          output: output.concat(shorten(line)),
          prev: line
        };
      } else if (inMyCode(line, prev)) {
        return {
          context: [],
          omittedCount: 0,
          output: output.concat(shorten(line)),
          prev: line
        };
      } else if (inOtherCode(line, prev)) {
        return {
          context: [line],
          omittedCount: omittedCount + 1,
          output,
          prev: line
        };
      } else {
        throw new Error('This code path should be unreachable');
      }
    }
    let { context, omittedCount, output } = lines.reduce(loop, {
      context: [],
      omittedCount: 0,
      output: [],
      prev: undefined
    });
    let omitted = omittedCount > 2 ? [context[0].replace(/at.*/, `...(${omittedCount - 2} lines skipped)...`)] : [];
    return output.concat(omitted, context.map(shorten)).join('\n');
  }

  return minimize;
}

module.exports = create;
