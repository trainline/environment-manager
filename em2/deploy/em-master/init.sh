#!/usr/bin/env bash

<<HELP
This script will loop through all the lambda directories and create zip files to deploy.
HELP

cd ./lambda

# for everything in the lambda folder...
for d in */ ; do

  # jump into the lambda folder
  cd ./${d}

  # if there is a node_modules folder, delete it
  if [ -d ./node_modules ]; then
    echo node_modules being removed...
    rm -rf node_modules
  fi

  # If there is already a zip file, skip this step
  if [ -f ${d%/}.zip ]; then
    echo ${d%/}.zip already exists
  # create the zip file out of the contents of the lambd dir
  else
    echo Creating ./${d%/}.zip
    zip -r ./${d%/}.zip .
  fi

  # step back up to the lambda folder for the next iteration...
  cd ..
done