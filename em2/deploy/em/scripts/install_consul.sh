#!/usr/bin/env bash

#
# Fetch Consul 
#

echo "Fetching Consul..."
CONSUL_VERSION=0.8.0
mkdir -p /tmp/consul
cd /tmp/consul
wget https://releases.hashicorp.com/consul/${CONSUL_VERSION}/consul_${CONSUL_VERSION}_linux_amd64.zip -O consul.zip --quiet

echo "Installing Consul..."
sudo apt-get install unzip -y
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

echo "Installing Systemd service..."
sudo chown root:root /tmp/consul.service
sudo mv /tmp/consul.service /etc/systemd/system/consul.service
sudo chmod 0644 /etc/systemd/system/consul.service

echo "Starting Consul Service"
sudo systemctl enable consul.service
sudo systemctl start consul