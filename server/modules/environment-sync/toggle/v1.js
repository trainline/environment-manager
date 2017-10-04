'use strict';

let toggleSlices = require('commands/slices/ToggleSlicesByUpstream');
let {
  MESSAGE_TYPE: { RunTask, TaskStarted },
  TASK_STATUS: { queued, running }
} = require('emjen');

function toggle(
  { Args: { Environment, Upstream, Slice }, JobId, ReplyTo, TaskId, TTL, User },
  { sendToReplyQueue, sendToWorkQueue }) {
  return Promise.resolve()
    .then(() => toggleSlices({ environmentName: Environment, upstreamName: Upstream, username: User }))
    .then(() => sendToWorkQueue({
      Args: {
        Environment,
        Interval: 10,
        Slice,
        Upstream
      },
      Command: 'await-toggle/v1',
      ReplyTo,
      Status: queued,
      TTL,
      Type: RunTask
    }))
    .then(() => sendToReplyQueue({ Status: running, Type: TaskStarted }));
}

module.exports = toggle;
