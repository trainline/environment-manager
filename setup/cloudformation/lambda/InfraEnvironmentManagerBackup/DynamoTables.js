var AwsAccount  = require('./AwsAccount'),
    DynamoTable = require('./DynamoTable');

var Convert = {
  objectToJsonString: function(object) {
    var result = JSON.stringify(object, null, '  ');
    return result;
  },
  jsonStringToObject: function(jsonString) {
    var result = JSON.parse(jsonString);
    return result;
  }
};

var Stringify = {
  defaultDynamoTableContent: function(content) {
    var result = content.map(Convert.objectToJsonString)
                        .join(',\n');

    return result;
  },
  lbUpstreamDynamoTableContent: function(content) {
    var normalizeValue = function(item) {
      item.Value = Convert.jsonStringToObject(item.value);
      delete item.value;

      return item;
    };

    var result = content.map(normalizeValue)
                        .map(Convert.objectToJsonString)
                        .join(',\n');

    return result;
  }
};

var MasterAccount = new AwsAccount('prod', 499033042897); 

var ChildrenAccounts = [
  new AwsAccount('et',   253740533400),
  new AwsAccount('nft', 262213454988),
  new AwsAccount('captaintrain-prod', 176987709779),
  new AwsAccount('captaintrain-test', 477156780053),
  new AwsAccount('test', 743871665500),
];

var tables = [
  new DynamoTable('ConfigEnvironments',      MasterAccount, Stringify.defaultDynamoTableContent),
  new DynamoTable('ConfigEnvironmentTypes',  MasterAccount, Stringify.defaultDynamoTableContent),
  new DynamoTable('ConfigServices',          MasterAccount, Stringify.defaultDynamoTableContent),
  new DynamoTable('ConfigDeploymentMaps',    MasterAccount, Stringify.defaultDynamoTableContent),
  new DynamoTable('ConfigLBSettings',        MasterAccount, Stringify.defaultDynamoTableContent),
  new DynamoTable('ConfigLBUpstream',        MasterAccount, Stringify.lbUpstreamDynamoTableContent),
//new DynamoTable('InfraChangeAudit',        MasterAccount, Stringify.defaultDynamoTableContent),
  new DynamoTable('InfraConfigPermissions',  MasterAccount, Stringify.defaultDynamoTableContent),
  new DynamoTable('InfraEnvManagerSessions', MasterAccount, Stringify.defaultDynamoTableContent),
  new DynamoTable('InfraConfigClusters',     MasterAccount, Stringify.defaultDynamoTableContent),
];

ChildrenAccounts.forEach(function(account) {

  tables.push(new DynamoTable('ConfigLBSettings', account, Stringify.defaultDynamoTableContent));
  tables.push(new DynamoTable('ConfigLBUpstream', account, Stringify.lbUpstreamDynamoTableContent));
//tables.push(new DynamoTable('InfraChangeAudit', account, Stringify.defaultDynamoTableContent));

});

module.exports = tables;
