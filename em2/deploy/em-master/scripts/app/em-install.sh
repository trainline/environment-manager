sudo apt-get update 
sudo apt-get install awscli -y
sudo apt-get install unzip -y
sudo apt-get install nodejs nodejs-legacy npm -y

mkdir -p /tmp/environment-manager
cd /tmp/environment-manager
aws s3api get-object --bucket environment-manager-releases --key environment-manager/environment-manager-5.0.0.zip ./environment-manager-5.0.0.zip

mkdir ./environment-manager
unzip environment-manager-5.0.0.zip -d ./environment-manager >/dev/null
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

sudo systemctl enable environment-manager.service
sudo systemctl start environment-manager.service
