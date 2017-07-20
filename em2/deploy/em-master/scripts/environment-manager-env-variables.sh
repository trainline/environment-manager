#!/usr/bin/env bash

EM_AWS_REGION=$(cat /tmp/em/EM_AWS_REGION | tr -d '\n')
echo "EM_AWS_REGION=$EM_AWS_REGION" | sudo tee --append /etc/environment-manager.env
EM_AWS_S3_BUCKET=$(cat /tmp/em/EM_AWS_S3_BUCKET | tr -d '\n')
echo "EM_AWS_BUCKET=$EM_AWS_S3_BUCKET" | sudo tee --append /etc/environment-manager.env
EM_AWS_S3_KEY=$(cat /tmp/em/EM_AWS_S3_KEY | tr -d '\n')
echo "EM_AWS_S3_KEY=$EM_AWS_S3_KEY" | sudo tee --append /etc/environment-manager.env
AWS_REGION=$(cat /tmp/em/AWS_REGION | tr -d '\n')
echo "AWS_REGION=$AWS_REGION" | sudo tee --append /etc/environment-manager.env
EM_PACKAGES_BUCKET=$(cat /tmp/em/EM_PACKAGES_BUCKET | tr -d '\n')
echo "EM_PACKAGES_BUCKET=$EM_PACKAGES_BUCKET" | sudo tee --append /etc/environment-manager.env
EM_PACKAGES_KEY_PREFIX=$(cat /tmp/em/EM_PACKAGES_KEY_PREFIX | tr -d '\n')
echo "EM_PACKAGES_KEY_PREFIX=$EM_PACKAGES_KEY_PREFIX" | sudo tee --append /etc/environment-manager.env
IS_PRODUCTION=$(cat /tmp/em/IS_PRODUCTION | tr -d '\n')
echo "IS_PRODUCTION=$IS_PRODUCTION" | sudo tee --append /etc/environment-manager.env
EM_REDIS_ADDRESS=$(cat /tmp/em/EM_REDIS_ADDRESS | tr -d '\n')
echo "EM_REDIS_ADDRESS=$EM_REDIS_ADDRESS" | sudo tee --append /etc/environment-manager.env
EM_REDIS_PORT=$(cat /tmp/em/EM_REDIS_PORT | tr -d '\n')
echo "EM_REDIS_PORT=$EM_REDIS_PORT" | sudo tee --append /etc/environment-manager.env
EM_REDIS_CRYPTO_KEY=$(cat /tmp/em/EM_REDIS_CRYPTO_KEY | tr -d '\n')
echo "EM_REDIS_CRYPTO_KEY=$EM_REDIS_CRYPTO_KEY" | sudo tee --append /etc/environment-manager.env


