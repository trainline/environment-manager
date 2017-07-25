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

ENV="
USE_HTTP=true
BLUEBIRD_LONG_STACK_TRACES=1
NODE_ENV=production
EM_AWS_REGION=${region}
EM_AWS_S3_BUCKET=${secure_bucket}
EM_AWS_RESOURCE_PREFIX=${resource_prefix}
EM_AWS_S3_KEY=${config_key}
EM_LOG_LEVEL=info
EM_PACKAGES_BUCKET=${packages_bucket}
EM_PACKAGES_KEY_PREFIX=${packages_key_prefix}
EM_REDIS_ADDRESS=${redis_address}
EM_REDIS_PORT=${redis_port}
EM_REDIS_CRYPTO_KEY_S3_BUCKET=${secure_bucket}
EM_REDIS_CRYPTO_KEY_S3_KEY=${redis_key_key}
"

#execute install script
chmod 700 ./em-install.sh
./em-install.sh "$ENV"