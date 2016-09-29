var lambda = require("./index.js");



//test with a lambda event

lambda.handler({detail: {requestParameters: {AutoScalingGroupName: "asgLambdaTest6"}}},{
		fail: function(m){console.log("fail:"+m)}, 
		success: function(m){console.log("Success:"+m)}
	})

//test with an SNS event:
