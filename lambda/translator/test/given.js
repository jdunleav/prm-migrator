exports.aRecord = {        
    "eventID": "1",
    "eventVersion": "1.0",
    "dynamodb": {
        "Keys": {
            "Id": {
                "N": "101"
            }
        },
        "NewImage": {
            "Message": {
                "S": "New item!"
            },
            "Id": {
                "N": "101"
            }
        },
        "StreamViewType": "NEW_AND_OLD_IMAGES",
        "SequenceNumber": "111",
        "SizeBytes": 26
    },
    "awsRegion": "eu-west-2",
    "eventName": "INSERT",
    "eventSourceARN": "arn:aws:dynamodb:eu-west-2:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
    "eventSource": "aws:dynamodb"
};