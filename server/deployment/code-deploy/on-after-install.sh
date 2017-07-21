#!/usr/bin/env bash

create_systemd_unit() {
  echo "Creating systemd unit ${1}" >&2
  local SERVICE_DEFINITION=$1
  local SRC_FILE=/opt/environment-manager/deployment/systemd/${SERVICE_DEFINITION}
  local TARGET_FILE=/lib/systemd/system/${SERVICE_DEFINITION}
  
  cp -f ${SRC_FILE} ${TARGET_FILE}
  chmod 644 ${TARGET_FILE}
  chown root.root ${TARGET_FILE}
}

create_systemd_unit "environment-manager.service"
create_systemd_unit "environment-manager-debug.service"

echo "Allowing execution of environment-manager start script" >&2
chmod a+x /opt/environment-manager/start