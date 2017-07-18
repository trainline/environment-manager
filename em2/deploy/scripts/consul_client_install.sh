#!/usr/bin/env bash

CONSUL_VERSION=0.8.0
CONSUL_JOIN_IPS='"172.31.97.249", "172.31.114.16", "172.31.103.180"'
CONSUL_DATACENTER=test1
CONSUL_ACL_DATACENTER=test1
CONSUL_ACL_TOKEN=5834f3a3-e6f2-d76e-c8b2-3d3cdd16b855

echo "Fetch Dependencies..."
sudo apt-get update
sudo apt-get install make python2.7 python-setuptools python-dev build-essential unzip -y

echo "Fetch Consul..."
mkdir /tmp/consul
cd /tmp/consul
wget https://releases.hashicorp.com/consul/${CONSUL_VERSION}/consul_${CONSUL_VERSION}_linux_amd64.zip -O consul.zip --quiet

echo "Installing Consul..."
unzip consul.zip >/dev/null
chmod +x consul
sudo mv consul /usr/local/bin/consul
sudo mkdir -p /opt/consul/data
sudo mkdir -p /etc/consul.d
sudo touch /tmp/consul.service

CLIENT_JSON="{
  \"datacenter\": \"$CONSUL_DATACENTER\",
  \"server\": false,
  \"data_dir\": \"/opt/consul/data\",
  \"log_level\": \"INFO\",
  \"enable_syslog\": true,
  \"start_join\": [$CONSUL_JOIN_IPS],
  \"acl_datacenter\": \"$CONSUL_ACL_DATACENTER\",
  \"acl_token\": \"$CONSUL_ACL_TOKEN\",
  \"acl_enforce_version_8\": false
}"
echo "$CLIENT_JSON" | sudo tee /etc/consul.d/client.json

#TODO:
#Add the name of the instance to the ExecStart line, "-node=name"
SERVICE="[Unit]
Description=Consul Agent
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

echo "Setting up iptables for Consul use..."
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

sudo systemctl enable consul.service
sudo systemctl start consul.service