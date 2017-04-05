'use strict';

function streamArn(tableName) {
    return {
        'Fn::GetAtt': [
            tableName,
            'StreamArn'
        ]
    };
}

function triggerAll(functionName, sourceArn) {
    return {
        "Type": "AWS::Lambda::EventSourceMapping",
        "Properties": {
            "BatchSize": 25,
            "Enabled": true,
            "EventSourceArn": sourceArn,
            "FunctionName": {
                "Ref": functionName
            },
            "StartingPosition": "LATEST"
        }
    }
}

function dependsOnSeq(resources) {
    function addDependencies(acc, key) {
        let [[prev,],] = acc;
        return [
            [key, Object.assign({ DependsOn: prev }, resources[key])],
            ...acc
        ];
    }
    function pairsToObject(acc, [key, value]) {
        acc[key] = value;
        return acc;
    }
    let [head, ...tail] = Object.keys(resources);
    if (head) {
        return tail
            .reduce(addDependencies, [[head, resources[head]]])
            .reverse()
            .reduce(pairsToObject, {});
    } else {
        return {};
    }
}

module.exports = {
    dependsOnSeq,
    streamArn,
    triggerAll
}