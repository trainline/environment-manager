
Array.prototype.distinct = function(keySelector) {

  var result = [];
  var defaultSelector = (item) => { return item; };
  var keySelector = keySelector || defaultSelector;

  for(var i = 0; i < this.length; i++) {

    var target = this[i];
    var key    = keySelector(target);
    var exists = result.some((source) => { return keySelector(source) === key; });

    if (exists) continue;
    result.push(target);

  };

  return result;

};

