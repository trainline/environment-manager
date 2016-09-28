function AwsAccount(name, number) {
  var $this = this;

  $this.name   = name;
  $this.number = number;

  $this.toString = function() {
    return $this.name + '[' + $this.number + ']';
  };
}

module.exports = AwsAccount;
