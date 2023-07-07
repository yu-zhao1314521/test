import json;
import boto3

rest_api_id = '4qppov5b81'
# 更新资源策略中的白名单IP列表
ip_address = '192.169.96.201'
# 创建 API Gateway 客户端
client = boto3.client('apigateway', region_name='ap-south-1')
# 指定要连接的 API 的 RestApiId
api_id = '4qppov5b81'

try:
    # 调用客户端的 get_rest_api 方法，指定对应的 RestApiId
    response = client.get_rest_api(restApiId=api_id)

    # 输出返回结果
    policy = response['policy']
    print(policy)

    # 编辑资源策略
    resource_policy = json.loads(policy)
    print(resource_policy)
    resource_policy['Statement'][0]['Condition']['IpAddress']['aws:SourceIp'].append(ip_address)
    print(resource_policy)
    update_policy = json.dumps(resource_policy)
    # 更新API的资源策略
    apigateway.update_rest_api(
    restApiId=api_id,
    patchOperations=[
        {
            'op': 'replace',
            'path': '/policy',
            'value': update_policy
        }
    ]
    )
    # 发布API更改
    apigateway.create_deployment(
    restApiId=api_id,
    stageName='tscgw-pre'
    )
except Exception as e:
    # 输出异常信息
    print('发生错误:', str(e))


