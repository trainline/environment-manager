#!/bin/bash

set +e

max_retries=10
retries=0
http_port=40500

echo "Verifying the installation"

url="https://127.0.0.1:$http_port/api/diagnostics/status"
echo "Service URL=$url"

while [[ $retries -lt $max_retries ]]
do
	if curl -k -s $url --insecure | grep "OK"; then
		echo "Got 'OK'. Success!"
		exit 0
	fi
	sleep 1
	((retries++))
done

echo "max retries ($max_retries) reached, installation check failed"
exit 1
