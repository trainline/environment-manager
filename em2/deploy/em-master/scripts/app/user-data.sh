#!/usr/bin/env bash
#init
apt-get update
apt-get install awscli -y

#fetch init script from s3
aws s3api get-object --bucket em-testing-init --key em-asg-setup.sh ./em-asg-setup.sh

#execute init script
chmod 700 ./em-asg-setup.sh
./em-asg-setup.sh

#fetch install script from s3
aws s3api get-object --bucket em-testing-init --key em-install.sh ./em-install.sh

#execute install script
chmod 700 ./em-install.sh
./em-install.sh