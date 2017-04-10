/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/**
 * Remove verbose stuff from stack traces
 */

const FILE_LOCATION_REGEXP = /\((.*)(:[0-9]+:[0-9]+)\)/;
const LINE_FILTER_REGEXP = /^\s*at\s+/i;
const NOT_MY_CODE_REGEXP = /(node_modules)|(\([^\\\/]+:[0-9]+:[0-9]+\))|(\(native\))/;

const path = require('path');

let isMyCode = line => !NOT_MY_CODE_REGEXP.test(line);

let enteredMyCode = (line, prev) => isMyCode(line) && !isMyCode(prev);
let exitedMyCode = (line, prev) => !isMyCode(line) && isMyCode(prev);
let inMyCode = (line, prev) => isMyCode(line) && isMyCode(prev);
let inOtherCode = (line, prev) => !isMyCode(line) && !isMyCode(prev);

function create({ contextLines, filePathTransform }) {
  function shorten(line) {
    return line.replace(FILE_LOCATION_REGEXP, (match, fullPath, location) => {
      let file = filePathTransform(fullPath);
      return `(${file}${location})`;
    }).replace();
  }

  function minimize(stack) {
    let lines = stack.split('\n')
      .filter(line => LINE_FILTER_REGEXP.test(line))
      .map(line => line.replace(LINE_FILTER_REGEXP, ''));
    let linesSkippedMessage = (omittedCount) => {
      let skipped = omittedCount - (2 * contextLines);
      return skipped > 0 ? [`...(${skipped} line${skipped > 1 ? 's' : ''} skipped)...`] : [];
    };
    function loop({ context, omittedCount, output, prev }, line) {
      if (enteredMyCode(line, prev)) {
        let skipped = linesSkippedMessage(omittedCount);
        return {
          context: [],
          omittedCount: 0,
          output: output.concat(skipped, context.map(shorten), shorten(line)),
          prev: line
        };
      } else if (exitedMyCode(line, prev)) {
        return {
          context: [],
          omittedCount: 1,
          output: contextLines ? output.concat(shorten(line)) : output,
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
          context: contextLines ? [line] : [],
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
    let skipped = linesSkippedMessage(omittedCount);
    let rest = context.length > 0 ? skipped.concat(context.map(shorten)) : [];
    return output.concat(rest).join('\n');
  }

  return minimize;
}

create.build = () => {
  let basePath = path.dirname(require.resolve('package.json'));
  let filePathTransform = fullPath => path.relative(basePath, fullPath);
  return create({ contextLines: 0, filePathTransform });
};

module.exports = create;
