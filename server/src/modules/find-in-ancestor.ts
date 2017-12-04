import { existsSync } from "fs";
import { dirname, resolve } from "path";

module.exports = function findInAncestor(relativePath: string, startDir: string = ".") {
  function loop(dir: string): string | undefined {
    const file = resolve(dir, relativePath);
    const parentDir = dirname(dir);
    if (existsSync(file)) {
      return file;
    } else if (dir === parentDir) {
      return undefined;
    } else {
      return loop(parentDir);
    }
  }
  return loop(resolve(startDir));
};
