#!/usr/bin/env bash
#init
apt-get update
apt-get install awscli -y

#fetch init script from s3
aws s3api get-object --bucket em-testing-init --key init_ubuntu_1604.sh ./init_ubuntu_1604.sh

#execute init script
chmod 700 ./init_ubuntu_1604.sh
./init_ubuntu_1604.sh
