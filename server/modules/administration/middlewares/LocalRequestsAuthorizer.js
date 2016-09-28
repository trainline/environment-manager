"use strict";

let ip = require("ip");

/**
 * TODO: Permitting admin requests purely on the basis of a
 * string regex on the IP is a really, really, really bad idea.
 */
function middleware(req, res, next) {
  if (ip.isPrivate(req.ip)) {
    next();
  } else {
    res.status(401);
    res.send("Only local requests are allowed to this host.");
  }
}

module.exports = {
  middleware: middleware
};
