import requests
import sys

url = 'http://localhost:8080/diagnostics/healthchecks/ping'
response = requests.get(url)

if response.status_code == 200:
  sys.exit(0)
else
  sys.exit(2)