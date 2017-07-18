#!/usr/bin/env bash


# Params
CONSUL_VERSION=0.8.0
CONSUL_DATACENTER=test1
CONSUL_JOIN=172.31.97.249
CDA_VERSION=2.1.0
REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | grep region | awk -F\" '{print $4}')

#####################
# Setup the AWS CLI #
#####################

sudo apt-get install awscli -y
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
# Get the environment tag value
KEY=Environment
ENVIRONMENT=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=$KEY" --region=$REGION --output=text | cut -f5)
# Get the OwningClusterShortName tag value
KEY=OwningClusterShortName
OWNING_CLUSTER_SHORT_NAME=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" "Name=key,Values=$KEY" --region=$REGION --output=text | cut -f5)
# Strip the leading "i-" from the instance id
NODE_NAME=${INSTANCE_ID#i-}
# Create the "Name" tag value
INSTANCE_NAME="$ENVIRONMENT-$OWNING_CLUSTER_SHORT_NAME-$NODE_NAME"
# Set the name of this instance in this region
aws --region $REGION ec2 create-tags --resources $INSTANCE_ID --tags "Key=Name,Value=$INSTANCE_NAME"


#TODO: get the token from parameters
ACL_TOKEN=afc86aa9-af1a-8787-7960-73f53c1ece9b

#Update the OS 
#Download dependencies
sudo apt-get update
sudo apt-get install make python2.7 python-setuptools python-dev build-essential unzip -y
sudo easy_install pip

#Fetch Consul
cd /tmp
wget https://releases.hashicorp.com/consul/${CONSUL_VERSION}/consul_${CONSUL_VERSION}_linux_amd64.zip -O consul.zip --quiet

#Install Consul
unzip consul.zip >/dev/null
chmod +x consul
sudo mv consul /usr/local/bin/consul
sudo mkdir -p /opt/consul/data
sudo mkdir -p /etc/consul.d
sudo touch /tmp/consul.service

CLIENT_JSON='{
  "datacenter": "test1",
  "server": false,
  "data_dir": "/opt/consul/data",
  "log_level": "INFO",
  "enable_syslog": true,
  "start_join": ["172.31.97.249", "172.31.114.16", "172.31.103.180"],
  "acl_datacenter": "test1",
  "acl_token": "5834f3a3-e6f2-d76e-c8b2-3d3cdd16b855",
  "acl_enforce_version_8": false
}'
echo "$CLIENT_JSON" | sudo tee /etc/consul.d/client.json

#TODO:
#Add the name of the instance to the ExecStart line, "-node=name"
SERVICE="[Unit]
Description=consul agent
Wants=basic.target
After=basic.target network.target

[Service]
Restart=on-failure
ExecStart=/usr/local/bin/consul agent -config-dir=/etc/consul.d
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process

[Install]
WantedBy=multi-user.target"
echo "$SERVICE" | sudo tee /tmp/consul.service
sudo chown root:root /tmp/consul.service
sudo mv /tmp/consul.service /etc/systemd/system/consul.service
sudo chmod 0644 /etc/systemd/system/consul.service
sudo mkdir -p /etc/default


#IP Tables Configuration
sudo iptables -I INPUT -s 0/0 -p udp --dport 8500 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p tcp --dport 8500 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p udp --dport 8400 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p tcp --dport 8400 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p udp --dport 8300 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p tcp --dport 8300 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p udp --dport 8301 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p tcp --dport 8301 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p udp --dport 8302 -j ACCEPT
sudo iptables -I INPUT -s 0/0 -p tcp --dport 8302 -j ACCEPT
sudo iptables-save


#Fetch the CDA
cd /tmp
wget https://github.com/trainline/consul-deployment-agent/archive/${CDA_VERSION}.tar.gz -O em-agent-${CDA_VERSION}.tar.gz --quiet
tar xzvf em-agent-${CDA_VERSION}.tar.gz
sudo mv /tmp/consul-deployment-agent-${CDA_VERSION} /opt/em-agent-${CDA_VERSION}
cd /opt/em-agent-${CDA_VERSION}


echo "$CDA_VERSION" | sudo tee /etc/em-agent
CDA_SERVICE="[Unit]
Description=Environment Manager Agent
Wants=basic.target
After=basic.target network.target

[Service]
EnvironmentFile=/etc/em-agent
Restart=on-failure
ExecStart=/usr/bin/env python /opt/em-agent-${CDA_VERSION}/agent/core.py
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process

[Install]
WantedBy=multi-user.target"
echo "$CDA_SERVICE" | sudo tee /tmp/em-agent.service
sudo chown root:root /tmp/em-agent.service
sudo mv /tmp/em-agent.service /etc/systemd/system/em-agent.service
sudo chmod 0644 /etc/systemd/system/em-agent.service
sudo chown root:root /etc/em-agent
sudo chmod 0644 /etc/em-agent

#'Install' the CDA
#TODO: Get the values for bucket name and prefix for logs from paaafrkasfjknas
sudo make init
CONFIG=$"aws:
  # Credential for accessing S3. If not specified, IAM role on EC2 instance where agent is running will be used.
  access_key_id:
  aws_secret_access_key:
  
  #Deployment log shipping location. If not specified, logs will not be shipped to S3
  deployment_logs:
    bucket_name: em-daveandjake-logs 
    key_prefix: logs
consul:
  #Consul ACL token configuration. If not specified, no token will be used to access Consul key-value store.
  acl_token: $ACL_TOKEN
startup:
  # Path of the file used to signal instance readiness
  #semaphore_filepath: /some/path/semaphore.txt
  # Set to true to wait for instance readiness before triggering deployments. False otherwise.
  #wait_for_instance_readiness: true
"
sudo echo "$CONFIG" | sudo tee config.yml


#Start the Consul service
sudo systemctl enable consul.service
sudo systemctl start consul.service

sudo systemctl enable em-agent.service
sudo systemctl start em-agent.service

# Presumes running the agent like this...
# python ./agent/core