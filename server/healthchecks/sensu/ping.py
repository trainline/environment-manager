#!/usr/bin/python
import sys
import requests

from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

url = 'https://localhost:40500/diagnostics/healthchecks/ping'
response = requests.get(url, verify=False)

if response.status_code == 200:
  sys.exit(0)
else:
  sys.exit(2)