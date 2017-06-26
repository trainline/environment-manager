### InfraAsgScale

Maintains a list of currently active servers in each AutoScalingGroup. It does this by listening to AutoScaling events, and refreshing a dynamoDB table.

This has the advantages:
- Can support maintenance mode independently of the AutoScalingGroup Standby feature. 
- Consolidates a view of ASGs across multiple child accounts, for centralised management, such as DNS updates (DNS update code not included).
- Reduces calls to the AutoScaling API.

To Install:

- Edit the file to indicate if it is the master account copy, or a child account. If it is the child account copy, you will need to provide the account number of your master account. 
- Zip the file with the dependencies and upload to Lambda, or via S3 if you prefer.
- When you configure the service in AWS Lambda:
    - CONFIGURATION
    - Runtime: NodeJS
    - Handler: index.Handler
    - Role: Choose existing:
        - roleInfraAsgScale
    - Description: Updates DynamoDB InfraASGIPs table with active instances in each ASG, when they change.
    - RAM: 128MB
    - Timeout: 8 seconds 
    - NO VPC needed. 
    
    The above settings worked fine for 1000+ instances in our test environment. 
    
    - TRIGGERS
    - Choose the SNS notification source InfraASGLambdaScale SNS topic
    - Add a new Cloudwatch Event. You might need to enable CloudWatch Events on your account if it is not already configured. 
    - The Event pattern is:
    ```
        {
          "detail-type": [
            "AWS API Call via CloudTrail"
          ],
          "detail": {
            "eventSource": [
              "autoscaling.amazonaws.com"
            ],
            "eventName": [
              "EnterStandby",
              "ExitStandby",
              "UpdateAutoScalingGroup"
            ]
          }
        }
      ```

        
You need one copy of this per account, if you have multiple environments in one account, then only 1 copy of the script will be needed.

