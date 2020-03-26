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

import { CognitoToApiGatewayToLambda } from '@aws-solutions-konstruk/aws-cognito-apigateway-lambda';
import { LambdaToDynamoDB } from '@aws-solutions-konstruk/aws-lambda-dynamodb';
import { Construct, Stack, StackProps, Duration, Fn } from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { Provider } from '@aws-cdk/custom-resources';
import { CustomResource } from '@aws-cdk/aws-cloudformation';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { UserPoolAttribute } from '@aws-cdk/aws-cognito';
import { Cors } from '@aws-cdk/aws-apigateway';
import { AttributeType } from '@aws-cdk/aws-dynamodb';

export class ServerlessBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const websiteBucketName: string = Fn.importValue('websiteBucket');

    const konstruk = new CognitoToApiGatewayToLambda(this, 'CognitoToApiGatewayToLambda', {
      deployLambda: true,
      lambdaFunctionProps: {
        code: lambda.Code.asset(`${__dirname}/lambda/business-logic`),
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: 'index.handler'
      },
      cognitoUserPoolProps: {
        userPoolName: 'WileRydes',
        autoVerifiedAttributes: [UserPoolAttribute.EMAIL]
      },
      apiGatewayProps: {
        defaultCorsPreflightOptions: {
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: Cors.ALL_METHODS
        }
      }
    });

    const lambdaFunc = new lambda.Function(this, 'updateConfigHandler', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'update_s3_object.on_event',
      code: lambda.Code.fromAsset(`${__dirname}/lambda/cognito-config`),
      timeout: Duration.minutes(5),
      initialPolicy: [
        new PolicyStatement({
          actions: ["s3:PutObject",
                    "s3:PutObjectAcl",
                    "s3:PutObjectVersionAcl"],
          resources: [`arn:aws:s3:::${websiteBucketName}/*`]
        }),
      ]
    });

    const customResourceProvider = new Provider(this, 'CustomResourceProvider', {
      onEventHandler: lambdaFunc
    });

    new CustomResource(this, 'CustomResource', {
      provider: customResourceProvider,
      properties: {
        UserPool: konstruk.userPool().userPoolId,
        Client: konstruk.userPoolClient().userPoolClientId,
        Region: Stack.of(this).region,
        Bucket: websiteBucketName,
        RestApi: konstruk.restApi().url
      }
    });

    new LambdaToDynamoDB(this, 'LambdaToDynamoDB', {
      deployLambda: false,
      existingLambdaObj: konstruk.lambdaFunction(),
      dynamoTableProps: {
        tableName: 'Rides',
        partitionKey: {
            name: 'RideId',
            type: AttributeType.STRING
        }
      }
    });
  }
}