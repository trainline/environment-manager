'use strict';

let _ = require('lodash');

function getScheduleStateByAsg(asg) {
  if (!asg || !asg.Tags) {
    return null;
  }

  let schedule = _.find(asg.Tags, (t) => {
    return t.Key.toLowerCase() === 'schedule';
  });

  if (!schedule) {
    return null;
  }

  return schedule.Value;
}

module.exports = getScheduleStateByAsg;
