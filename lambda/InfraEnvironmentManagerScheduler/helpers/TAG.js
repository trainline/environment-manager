var TAG = {
  // Generates a useful function for filtering tags by name
  is: function (tagName) {
    return function (tag) { return tag.Key ? tag.Key.toLowerCase() === tagName : false; };
  },
  // Generates a useful function for retrieving tags value
  value: function () {
    return function (tag) { return tag.Value ? tag.Value.toLowerCase() : null; };
  }
};

module.exports = TAG;