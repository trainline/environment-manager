const fs = require('fs');
const path = require('path');

module.exports = function findInAncestor(file: string) {
  let absPath = path.resolve(file);
  let filename = path.basename(absPath);
  function loop(child: string): string | undefined {
    let parent = path.resolve(path.dirname(child), '..', filename);
    if (fs.existsSync(child)) {
      return child;
    } else if (child === parent) {
      return undefined;
    } else {
      return loop(parent);
    }
  }
  return loop(file);
};
