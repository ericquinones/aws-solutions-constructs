/**
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

// Imports
import { Stack } from "@aws-cdk/core";
import { ApiGatewayToDynamoDB, ApiGatewayToDynamoDBProps } from '../lib';
import { SynthUtils } from '@aws-cdk/assert';
import '@aws-cdk/assert/jest';
import { AttributeType } from "@aws-cdk/aws-dynamodb";

test('snapshot test ApiGatewayToDynamoDB default params', () => {
    const stack = new Stack();
    const apiGatewayToDynamoDBProps: ApiGatewayToDynamoDBProps = {};
    new ApiGatewayToDynamoDB(stack, 'test-api-gateway-dynamodb-default', apiGatewayToDynamoDBProps);
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('check getter methods', () => {
    const stack = new Stack();
    const apiGatewayToDynamoDBProps: ApiGatewayToDynamoDBProps = {};
    const construct = new ApiGatewayToDynamoDB(stack, 'test-api-gateway-dynamodb-default', apiGatewayToDynamoDBProps);

    expect(construct.dynamoTable()).toBeDefined();
    expect(construct.restApi()).toBeDefined();
});

test('check allow CRUD operations', () => {
    const stack = new Stack();
    const apiGatewayToDynamoDBProps: ApiGatewayToDynamoDBProps = {
        allowReadOperation: true,
        allowCreateOperation: true,
        createRequestTemplate: "{}",
        allowDeleteOperation: true,
        allowUpdateOperation: true,
        updateRequestTemplate: "{}"
    };
    new ApiGatewayToDynamoDB(stack, 'test-api-gateway-dynamodb', apiGatewayToDynamoDBProps);

    expect(stack).toHaveResource("AWS::IAM::Policy", {
        PolicyDocument: {
            Statement: [
                {
                    Action: "dynamodb:PutItem",
                    Effect: "Allow",
                    Resource: {
                        "Fn::GetAtt": [
                            "testapigatewaydynamodbDynamoTableEEE3F463",
                            "Arn"
                        ]
                    }
                },
                {
                    Action: "dynamodb:Query",
                    Effect: "Allow",
                    Resource: {
                        "Fn::GetAtt": [
                            "testapigatewaydynamodbDynamoTableEEE3F463",
                            "Arn"
                        ]
                    }
                },
                {
                    Action: "dynamodb:UpdateItem",
                    Effect: "Allow",
                    Resource: {
                        "Fn::GetAtt": [
                            "testapigatewaydynamodbDynamoTableEEE3F463",
                            "Arn"
                        ]
                    }
                },
                {
                    Action: "dynamodb:DeleteItem",
                    Effect: "Allow",
                    Resource: {
                        "Fn::GetAtt": [
                            "testapigatewaydynamodbDynamoTableEEE3F463",
                            "Arn"
                        ]
                    }
                }
            ],
            Version: "2012-10-17"
        },
        PolicyName: "testapigatewaydynamodbapigatewayroleDefaultPolicy43AC565D",
        Roles: [
            {
                Ref: "testapigatewaydynamodbapigatewayrole961B19C4"
            }
        ]
    });

    expect(stack).toHaveResource("AWS::ApiGateway::Method", {
        HttpMethod: "GET",
        AuthorizationType: "AWS_IAM"
    });

    expect(stack).toHaveResource("AWS::ApiGateway::Method", {
        HttpMethod: "POST",
        AuthorizationType: "AWS_IAM"
    });

    expect(stack).toHaveResource("AWS::ApiGateway::Method", {
        HttpMethod: "PUT",
        AuthorizationType: "AWS_IAM"
    });

    expect(stack).toHaveResource("AWS::ApiGateway::Method", {
        HttpMethod: "DELETE",
        AuthorizationType: "AWS_IAM"
    });

    expect(stack).toHaveResource("AWS::ApiGateway::Resource", {
        PathPart: "{id}",
    });
});

test('check allow read and update only', () => {
    const stack = new Stack();
    const apiGatewayToDynamoDBProps: ApiGatewayToDynamoDBProps = {
        allowUpdateOperation: true,
        updateRequestTemplate: "{}"
    };
    new ApiGatewayToDynamoDB(stack, 'test-api-gateway-dynamodb', apiGatewayToDynamoDBProps);

    expect(stack).toHaveResource("AWS::IAM::Policy", {
        PolicyDocument: {
            Statement: [
                {
                    Action: "dynamodb:Query",
                    Effect: "Allow",
                    Resource: {
                        "Fn::GetAtt": [
                            "testapigatewaydynamodbDynamoTableEEE3F463",
                            "Arn"
                        ]
                    }
                },
                {
                    Action: "dynamodb:UpdateItem",
                    Effect: "Allow",
                    Resource: {
                        "Fn::GetAtt": [
                            "testapigatewaydynamodbDynamoTableEEE3F463",
                            "Arn"
                        ]
                    }
                }
            ],
            Version: "2012-10-17"
        },
        PolicyName: "testapigatewaydynamodbapigatewayroleDefaultPolicy43AC565D",
        Roles: [
            {
                Ref: "testapigatewaydynamodbapigatewayrole961B19C4"
            }
        ]
    });

    expect(stack).toHaveResource("AWS::ApiGateway::Method", {
        HttpMethod: "GET",
        AuthorizationType: "AWS_IAM"
    });
});

test('check using custom partition key for dynamodb', () => {
    const stack = new Stack();
    const apiGatewayToDynamoDBProps: ApiGatewayToDynamoDBProps = {
        dynamoTableProps: {
            partitionKey: {
                name: 'page_id',
                type: AttributeType.STRING
            }
        }
    };
    new ApiGatewayToDynamoDB(stack, 'test-api-gateway-dynamodb', apiGatewayToDynamoDBProps);

    expect(stack).toHaveResource("AWS::ApiGateway::Resource", {
        PathPart: "{page_id}",
    });

});
