### infraAsgLambdaScale

Maintains a list of currently active servers in each AutoScalingGroup. It does this by listening to AutoScaling events, and refreshing a dynamoDB table.

This has the advantages:
- Can support maintenance mode independently of the AutoScalingGroup Standby feature. 
- Consolidates a view of ASGs across multiple child accounts, for centralised management, such as DNS updates (DNS update code not included).
- Reduces calls to the AutoScaling API.

To Install:

- Edit the file to indicate if it is the master account copy, or a child account. If it is the child account copy, you will need to provide the account number of your master account. 
- Zip the file with the dependencies and upload to Lambda, or via S3 if you prefer.
- When you configure the service in AWS Lambda:
    - Use node
    - Use the role roleInfraAsgScale
    - Choose the SNS notification source InfraASGLambdaScale SNS topic
    - Give it at least 8 seconds to run at 128MB
    
You need one copy of this per account, if you have multiple environments in one account, then only 1 copy of the script will be needed.

