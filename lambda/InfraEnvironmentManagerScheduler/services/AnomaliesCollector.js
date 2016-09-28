/**
 * This service allows to collect anomalies detected during the process and retrieve them.
 */
function AnomaliesCollector() {
  
  var self = this;
  var anomalies = [];
  
  self.add = function (anomaly) {
    anomalies.push(anomaly);
  };
  
  self.any = function () {
    return anomalies.length > 0;
  };
  
  self.all = function () {
    return anomalies;
  };


}

module.exports = AnomaliesCollector;