#!/usr/bin/env bash

#Params
CONSUL_VERSION=0.8.0
CONSUL_DATACENTER=test1
CONSUL_JOIN=172.31.10.55
CDA_VERSION=2.1.0
ACL_TOKEN=b40f4f5d-35c4-05de-79a0-46bfb9a55d23

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
echo "-join=${CONSUL_JOIN} -CONSUL_DATACENTER=${CONSUL_DATACENTER} -data-dir=/opt/consul/data" > /tmp/consul_flags
CONSUL_FLAGS=`cat /tmp/consul_flags`
SERVICE="[Unit]
Description=consul agent
Wants=basic.target
After=basic.target network.target

[Service]
EnvironmentFile=-/etc/default/consul
Restart=on-failure
ExecStart=/usr/local/bin/consul agent $CONSUL_FLAGS -config-dir=/etc/consul.d
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process

[Install]
WantedBy=multi-user.target"
echo "$SERVICE" | sudo tee /tmp/consul.service
sudo chown root:root /tmp/consul.service
sudo mv /tmp/consul.service /etc/systemd/system/consul.service
sudo chmod 0644 /etc/systemd/system/consul.service
sudo mv /tmp/consul_flags /etc/default/consul
sudo chown root:root /etc/default/consul
sudo chmod 0644 /etc/default/consul

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

#Start the Consul service
sudo systemctl enable consul.service
sudo systemctl start consul.service


#Fetch the CDA
cd /tmp
wget https://github.com/trainline/consul-deployment-agent/archive/${CDA_VERSION}.tar.gz -O consul-deployment-agent-${CDA_VERSION}.tar.gz --quiet
tar xzvf consul-deployment-agent-${CDA_VERSION}.tar.gz
cd /tmp/consul-deployment-agent-${CDA_VERSION}

#'Install' the CDA
sudo make init
CONFIG=$"aws:
  # Credential for accessing S3. If not specified, IAM role on EC2 instance where agent is running will be used.
  # access_key_id: <ACCESS KEY ID>
  # aws_secret_access_key: <AWS SECRET ACCESS KEY>
  
  #Deployment log shipping location. If not specified, logs will not be shipped to S3
  #deployment_logs:
  #  bucket_name: <BUCKET NAME>
  #  key_prefix: <PREFIX VALUE>
consul:
  #Consul ACL token configuration. If not specified, no token will be used to access Consul key-value store.
  acl_token: $ACL_TOKEN
startup:
  # Path of the file used to signal instance readiness
  #semaphore_filepath: /some/path/semaphore.txt
  # Set to true to wait for instance readiness before triggering deployments. False otherwise.
  #wait_for_instance_readiness: true
"
sudo echo "$CONFIG" | sudo tee config/config.yml

python /tmp/consul-deployment-agent-${CDA_VERSION}/agent/core.py &