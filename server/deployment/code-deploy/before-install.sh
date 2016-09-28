#!/usr/bin/env bash

set -eux

# Moving to proper working directory
BASEDIR=$(dirname $0)
cd $BASEDIR

echo "Installing npm dependencies";

npm install --production --no-bin-links
