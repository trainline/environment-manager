import { existsSync } from "fs";
import { basename, dirname, resolve } from "path";

module.exports = function findInAncestor(file: string) {
  const absPath = resolve(file);
  const filename = basename(absPath);
  function loop(child: string): string | undefined {
    const parent = resolve(dirname(child), "..", filename);
    if (existsSync(child)) {
      return child;
    } else if (child === parent) {
      return undefined;
    } else {
      return loop(parent);
    }
  }
  return loop(file);
};
