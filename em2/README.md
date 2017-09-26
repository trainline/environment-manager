# Environment Manager (Serverless)

## Deployments..

- Install serverless

``` npm install -g serverless ```

- Set AWS Credentials in Environment Variables
- Open prompt at service level. E.g..

``` cd config/accounts ```

- Install dependencies

``` npm install ```

- Deploy

``` serverless deploy --region eu-west-1 --stage uat --bucket my-uat-packages-bucket ```