#!/usr/bin/env bash
#init
apt-get update
apt-get install awscli -y

#fetch init script from s3
sudo aws s3api get-object --bucket em-testing-init --key init_ubuntu_1604.sh ./init_ubuntu_1604.sh

#execute init script
sudo chmod 700 ./init_ubuntu_1604.sh
sudo ./init_ubuntu_1604.sh

PARAMETERS='{"":""}'
echo PARAMETERS > /tmp/user_data