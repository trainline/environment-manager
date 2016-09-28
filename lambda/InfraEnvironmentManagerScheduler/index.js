"use strict";

// External Libraries

var Bootstrapper = require('./Bootstrapper.js');

exports.handler = function (event, context) {

  var bootstrapper = new Bootstrapper();
  var governator = bootstrapper.createGovernator();  
  
  function printAnomaly(anomaly) {
    console.log('[%s] %s', anomaly.Type, anomaly.toString());
  }

  governator.govern(function(anomalies) {

    if (anomalies.length === 0) {
      context.succeed();
    } else {
      console.log('Detected anomalies:');
      anomalies.forEach(printAnomaly);
      context.fail(anomalies.length + ' anomalies have been detected');
    }

  });

}