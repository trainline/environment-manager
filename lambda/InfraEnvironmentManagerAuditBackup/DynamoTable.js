function pad(number) {
  return number < 10 ? '0' + number : number;
};

function getDatestamp(date) {
  var result = [
        date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate())
  ].join('');

  return result;
}

function getDynamoTableBackupFilename(dynamoTable) {
  var datestamp = getDatestamp(new Date());

  var filename = [
    datestamp,
    'environmentmanager',
    dynamoTable.name,
    dynamoTable.account.name
  ].join('_') + '.json';

  var result = [
    'Infra',
    'EnvironmentManager',
    filename
  ].join('/');

  return result;
};

function DynamoTable(name, account, stringifier) {
  var $this = this;

  $this.name      = name;
  $this.account   = account;
  $this.stringify = stringifier;

  $this.toString = function() {
    return [$this.account.name, $this.name].join('/');
  };

  $this.toBackupFilename = function() {
    return getDynamoTableBackupFilename($this);
  };

}

module.exports = DynamoTable;
