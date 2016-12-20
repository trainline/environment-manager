/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

function RateLimiter(taskLimitPerSecond) {

  let tasksStartedWithinTheSecond = 0;
  let jobQueue = [];

  this.queueTask = function(task) {
    if (rateLimitNotReached()) {
      return startTask(task);
    }
    
    return new Promise((resolve, reject) => {
      jobQueue.push({ task, resolve, reject });
    });
  }

  function rateLimitNotReached() {
    return tasksStartedWithinTheSecond < taskLimitPerSecond;
  }

  function startTask(task) {
    tasksStartedWithinTheSecond++;
    setTimeout(timeoutCompleted, 1000);
    return task();
  }

  function timeoutCompleted() {
    tasksStartedWithinTheSecond--;
    if (jobQueue.length > 0) {
      let job = jobQueue.shift();
      startTask(job.task).then(job.resolve).catch(job.reject);
    }
  }

};

module.exports = RateLimiter;