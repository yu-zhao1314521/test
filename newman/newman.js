const newman = require('newman');
const { DynamoDBClient, DescribeTableCommand ,ScanCommand} = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

newman.run({
    collection: require('./20230629FXS.postman_collection.json')
}).on('done', function (err, response) {
   // 当测试运行完成时触发此事件
  if (err || response.error) {
    console.error('运行出错:', err || response.error);
  } else {
    console.log('测试运行完成.');
    // 遍历每个请求的执行结果
    response.run.executions.forEach((execution) => {
      
      const requestName = execution.item.name;
      const requestMethod = execution.request.method;
      const requestUrl = execution.request.url.toString();
      //const requestHeaders = execution.request.headers.toJSON();
      //const requestBody = execution.request.body;
      console.log(`请求标题：${requestName}`);
      console.log(`请求方法：${requestMethod}`);
      console.log(`请求URL：${requestUrl}`);
      console.log("status:"+execution.response.status+"code:"+execution.response.code)
      const responseTimeHeader = execution.response.headers.find(header => header.key.toLowerCase() === 'date');
      console.log(responseTimeHeader);
      var date = new Date(responseTimeHeader).toISOString();
      console.log(`请求结束的时间：${date}`);
      date = date.substring(0,date.lastIndexOf(".")-8);
      const params = {
        TableName: 't-InfoLog', // 表名
        FilterExpression: 'contains(#ts,:value) AND (#log = :value2 or #log = :value3) AND #ifid = :value4',
        //FilterExpression: '(#log = :value2 or #log = :value3) AND #ifid = :value4',
        ExpressionAttributeNames: {
        '#ts': 'timestamp',
        '#log': 'logLevel',
        '#ifid': 'ifid'
        },
        ExpressionAttributeValues: {
        ':value': { S:date },
        ':value2': { S:'ERROR'},
        ':value3': { S:'WARN'},
        ':value4': { S:'IT303E'}
        }
      };
      if (requestName.includes("IT303E")) {
      params.ExpressionAttributeValues[':value4'] = { S: 'IT303E' };
      }
      if (requestName.includes("IT208E")) {
      params.ExpressionAttributeValues[':value4'] = { S: 'IT208E' };
      }
     console.log('DynamoDB的查询参数：',params);
     const command = new ScanCommand(params);
      ddbDocClient.send(command)
      .then((response) => {
        // response.Items.forEach(item=>{
        //   console.log('item.timestamp', item.timestamp.S);
        // });
      const firstItem = response.Items.sort((a, b) => new Date(b.timestamp.S) - new Date(a.timestamp.S)).shift();
         if (firstItem) {
         const time = firstItem.timestamp.S; 
         console.log(`请求：${requestName}有${firstItem.logLevel.S}`);
         console.log('该数据的时间：', time);
         console.log(firstItem);
         } else {
         console.log(`请求：${requestName}没有ERROR或者WARN`);
         }
      })
      .catch((error) => {
      console.error('Error:', error);
      });
    });
  }
})








