
Array.prototype.distinct = function (keySelector) {
  let result = [];
  let defaultSelector = item => item;

  var keySelector = keySelector || defaultSelector;

  for (let i = 0; i < this.length; i++) {
    let target = this[i];
    let key = keySelector(target);
    let exists = result.some(source => keySelector(source) === key);

    if (exists) continue;
    result.push(target);
  }

  return result;
};

