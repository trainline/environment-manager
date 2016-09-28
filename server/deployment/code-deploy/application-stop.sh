#!/usr/bin/env bash

if systemctl is-active environment-manager | grep "^active$"; then
  systemctl stop environment-manager
fi
