const uuid = require("uuid/v4");
const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

AWS.config.update({ region: "eu-west-2" });

const MigrationEventStates = {
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED"
};

class MigrationEventStateMachine {
  constructor(client) {
    this.uuid = undefined;
    this.status = MigrationEventStates.REJECTED;
    this.client = client;
  }

  async accept() {
    if (this.uuid !== undefined) {
      throw new Error(
        `INVALID STATE TRANSITION: Cannot move from ${this.state} to ${
          MigrationEventStates.ACCEPTED
        }`
      );
    }
    try {
      const expectedID = uuid();
      const expectedState = MigrationEventStates.ACCEPTED;
      const result = await this.client.put({
        PROCESS_ID: expectedID,
        PROCESS_STATUS: expectedState
      });
      this.uuid = result.PROCESS_ID;
      this.status = result.PROCESS_STATUS;
    } catch (err) {
      console.log(err);
    }
    
    return this;
  }

  get currentStatus() {
    return this.status;
  }

  get correlationId() {
    return this.uuid;
  }
}

class ProcessStatusWrapper {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  async put(item) {
    const result = await this.dbClient
      .put({
        TableName: "PROCESS_STORAGE",
        Item: item,
        ReturnValues: "ALL_OLD"
      })
      .promise();    
    return item;
  }

  async get(key) {
      return await this.dbClient.get(
        {
            TableName : 'PROCESS_STORAGE',
            Key: {
              PROCESS_ID: key
            }
        }
      ).promise();
  }

  async delete(key) {
      return await this.dbClient.delete(
        {
            TableName : 'PROCESS_STORAGE',
            Key: {
              PROCESS_ID: key
            }
        }          
      ).promise();
  }
}

exports.ProcessStatusWrapper = ProcessStatusWrapper;

exports.main = async function(dbClient) {
  const event = new MigrationEventStateMachine(
    new ProcessStatusWrapper(dbClient)
  );
  const result = await event.accept();
  return result;
};

const client = new AWS.DynamoDB.DocumentClient();
exports.handler = function(event, context, callback) {
    // handle AWS specific stuff here
        
    async function wrapper(){
        // call the businesss logic
        const result = await main(client);
        // handle converting back to AWS
        return {
            statusCode: 200,
            body: JSON.stringify({
              uuid: result.correlationId,
              status: result.currentStatus
            }),
            isBase64Encoded: false
        }
    }
        
    callback(wrapper())
}
