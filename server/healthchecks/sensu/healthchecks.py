import sys
import requests
from requests import ConnectionError

from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

def success():
  print('Healthcheck passed')
  sys.exit(0)

def fail(reason):
  print(reason)
  sys.exit(2)

def run_check(name):
  url = 'https://localhost:40500/diagnostics/healthchecks/' + name
  
  try:
    response = requests.get(url, verify=False)
  except ConnectionError:
    fail('Could not connect to ' + url)
  except Exception as ex:
    fail('An error ocurred: ' + ex.message)
  
  if response.status_code == 200:
    success()
  else:
    fail(response.json()['reason'])