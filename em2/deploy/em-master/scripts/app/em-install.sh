sudo apt-get update 
sudo apt-get install awscli -y
sudo apt-get install unzip -y
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install nodejs -y

mkdir -p /tmp/environment-manager
cd /tmp/environment-manager
aws s3api get-object --bucket environment-manager-releases --key environment-manager/environment-manager-latest.zip ./environment-manager-latest.zip

mkdir ./environment-manager
unzip environment-manager-latest.zip -d ./environment-manager >/dev/null
sudo mv environment-manager /opt/environment-manager

SERVICE="[Unit]
Conflicts=environment-manager-debug.service

[Service]
EnvironmentFile=/etc/environment-manager.env
WorkingDirectory=/opt/environment-manager/
ExecStart=/usr/bin/npm start

Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=environment-manager

[Install]
WantedBy=multi-user.target
"
echo "$SERVICE" | sudo tee /tmp/environment-manager/environment-manager.service
sudo chown root:root /tmp/environment-manager/environment-manager.service
sudo mv /tmp/environment-manager/environment-manager.service /etc/systemd/system/environment-manager.service
sudo chmod 0644 /etc/systemd/system/environment-manager.service

ENV_VARS=$1

echo "$ENV_VARS" | sudo tee /tmp/environment-manager/environment-manager.env
sudo chown root:root /tmp/environment-manager/environment-manager.env
sudo mv /tmp/environment-manager/environment-manager.env /etc/environment-manager.env
sudo chmod 0644 /etc/environment-manager.env

sudo systemctl enable environment-manager.service
sudo systemctl start environment-manager.service
