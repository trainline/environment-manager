'use strict';

function AwsAccount(name, number) {
  let $this = this;

  $this.name = name;
  $this.number = number;

  $this.toString = function () {
    return `${$this.name}[${$this.number}]`;
  };
}

module.exports = AwsAccount;
