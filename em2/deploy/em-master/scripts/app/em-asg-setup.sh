#!/usr/bin/env bash

#####################
# Setup the AWS CLI #
#####################

sudo apt-get install awscli -y
REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | grep region | awk -F\" '{print $4}')

if [ ! -d ~/.aws ]; then
  mkdir -p ~/.aws;
fi

AWS_CONFIGURATION="[default]
region=$REGION
output=json"

echo "$AWS_CONFIGURATION" | sudo tee ~/.aws/credentials

#####################
# Name the instance #
#####################

INSTANCE_ID=$(ec2metadata --instance-id)
ASG_NAME=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=aws:autoscaling:groupName" --region=$REGION --output=text | cut -f5)
NODE_NAME=${INSTANCE_ID#i-}
INSTANCE_NAME="$ASG_NAME-$NODE_NAME"

echo "Setting name of the instance to $INSTANCE_NAME"
aws --region $REGION ec2 create-tags --resources $INSTANCE_ID --tags "Key=Name,Value=$INSTANCE_NAME"
