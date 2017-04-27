#!/usr/bin/env bash

create_systemd_unit() {
  local SERVICE_DEFINITION=$1
  local SRC_FILE=/opt/environment-manager/deployment/systemd/${SERVICE_DEFINITION}
  local TARGET_FILE=/lib/systemd/system/${SERVICE_DEFINITION}
  
  cp -f ${SRC_FILE} ${TARGET_FILE}
  chmod 644 ${TARGET_FILE}
  chown root.root ${TARGET_FILE}
}

create_systemd_unit "environment-manager.service"
create_systemd_unit "environment-manager-debug.service"
