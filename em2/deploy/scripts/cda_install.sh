#!/usr/bin/env bash

CDA_VERSION=2.1.0
ACL_TOKEN=afc86aa9-af1a-8787-7960-73f53c1ece9b

echo "Fetching Consul Deployment Agent..."
mkdir -p /tmp/consul-deployment-agent
cd /tmp/consul-deployment-agent
wget https://github.com/trainline/consul-deployment-agent/archive/${CDA_VERSION}.tar.gz -O consul-deployment-agent-${CDA_VERSION}.tar.gz --quiet

echo "Installing Consul Deployment Agent"
tar xzvf consul-deployment-agent-${CDA_VERSION}.tar.gz
sudo mv /tmp/consul-deployment-agent-${CDA_VERSION} /opt/consul-deployment-agent-${CDA_VERSION}
cd /opt/consul-deployment-agent-${CDA_VERSION}
echo "CDA_VERSION=$CDA_VERSION" | sudo tee --append /etc/consul-deployment-agent

CDA_SERVICE="[Unit]
Description=Consul Deployment Agent
Wants=basic.target
After=basic.target network.target

[Service]
Restart=on-failure
EnvironmentFile=/etc/consul-deployment-agent
ExecStart=/usr/bin/env python /opt/consul-deployment-agent-${CDA_VERSION}/agent/core.py
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process

[Install]
WantedBy=multi-user.target
"
echo "$CDA_SERVICE" | sudo tee /tmp/consul-deployment-agent.service
sudo chown root:root /tmp/consul-deployment-agent.service
sudo mv /tmp/consul-deployment-agent.service /etc/systemd/system/consul-deployment-agent.service
sudo chmod 0644 /etc/systemd/system/consul-deployment-agent.service
sudo chown root:root /etc/consul-deployment-agent
sudo chmod 0644 /etc/consul-deployment-agent

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

sudo systemctl enable consul-deployment-agent.service
sudo systemctl start consul-deployment-agent.service