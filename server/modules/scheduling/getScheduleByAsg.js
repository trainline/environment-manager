'use strict';

let getTag = require('modules/scheduling/getTag');
let sources = require('modules/scheduling/sources');

module.exports = function getScheduleByAsg(asg, scheduleParser) {
  let result = { parseResult: null, source: null };

  if (!asg || !scheduleParser) {
    return result;
  }

  let asgSchedule = getTag(asg, 'schedule');

  if (asgSchedule) {
    result = { parseResult: scheduleParser(asgSchedule), source: sources.asg };
  }

  return result;
};
