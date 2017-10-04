'use strict';

let {
  MESSAGE_TYPE: { TaskCompleted },
  TASK_STATUS: { completed }
} = require('emjen');

function awaitToggle(message, { sendToReplyQueue, sendToWorkQueue }) {
  return Promise.resolve()
    .then(() => {
      return sendToReplyQueue({ Result: 'DONE', Status: completed, Type: TaskCompleted });
    });
}

module.exports = awaitToggle;
