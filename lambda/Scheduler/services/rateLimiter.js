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
    delay(1000).then(timeoutCompleted);
    return task();
  }

  function timeoutCompleted() {
    tasksStartedWithinTheSecond--;
    if (jobQueue.length > 0) {
      let job = jobQueue.shift();
      startTask(job.task).then(job.resolve).catch(job.reject);
    }
  }

  function delay(milliseconds) {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }

};

module.exports = RateLimiter;