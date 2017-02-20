#!/usr/bin/env bash

SERVICE_DEFINITION=environment-manager.service
SRC_FILE=/opt/environment-manager/deployment/systemd/${SERVICE_DEFINITION}
TARGET_FILE=/lib/systemd/system/${SERVICE_DEFINITION}

cp -f ${SRC_FILE} ${TARGET_FILE}

chmod 644 ${TARGET_FILE}

chown root.root ${TARGET_FILE}
