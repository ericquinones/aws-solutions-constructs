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

import * as lambda from '@aws-cdk/aws-lambda';
import { DynamoEventSourceProps, DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as defaults from '@aws-solutions-konstruk/core';
import { Construct } from '@aws-cdk/core';
import { overrideProps } from '@aws-solutions-konstruk/core';

/**
 * @summary The properties for the DynamoDBStreamToLambda Construct
 */
export interface DynamoDBStreamToLambdaProps {
  /**
   * Whether to create a new lambda function or use an existing lambda function.
   * If set to false, you must provide a lambda function object as `existingObj`
   *
   * @default - true
   */
  readonly deployLambda: boolean,
  /**
   * Existing instance of Lambda Function object.
   * If `deploy` is set to false only then this property is required
   *
   * @default - None
   */
  readonly existingLambdaObj?: lambda.Function,
  /**
   * Optional user provided props to override the default props.
   * If `deploy` is set to true only then this property is required
   *
   * @default - Default props are used
   */
  readonly lambdaFunctionProps?: lambda.FunctionProps,
  /**
   * Optional user provided props to override the default props
   *
   * @default - Default props are used
   */
  readonly dynamoTableProps?: dynamodb.TableProps,
  /**
   * Optional user provided props to override the default props
   *
   * @default - Default props are used
   */
  readonly dynamoEventSourceProps?: DynamoEventSourceProps
}

export class DynamoDBStreamToLambda extends Construct {
  private fn: lambda.Function;
  private table: dynamodb.Table;

  /**
   * @summary Constructs a new instance of the LambdaToDynamoDB class.
   * @param {cdk.App} scope - represents the scope for all the resources.
   * @param {string} id - this is a a scope-unique id.
   * @param {DynamoDBStreamToLambdaProps} props - user provided props for the construct
   * @since 0.8.0
   * @access public
   */
  constructor(scope: Construct, id: string, props: DynamoDBStreamToLambdaProps) {
    super(scope, id);

    this.fn = defaults.buildLambdaFunction(scope, {
      deployLambda: props.deployLambda,
      existingLambdaObj: props.existingLambdaObj,
      lambdaFunctionProps: props.lambdaFunctionProps
    });

    // Set the default props for DynamoDB table
    if (props.dynamoTableProps) {
      const dynamoTableProps = overrideProps(defaults.DefaultTableWithStreamProps, props.dynamoTableProps);
      this.table = new dynamodb.Table(this, 'DynamoTable', dynamoTableProps);
    } else {
      this.table = new dynamodb.Table(this, 'DynamoTable', defaults.DefaultTableWithStreamProps);
    }

    // Grant DynamoDB Stream read perimssion for lambda function
    this.table.grantStreamRead(this.fn.grantPrincipal);

    // Create DynamDB trigger to invoke lambda function
    this.fn.addEventSource(new DynamoEventSource(this.table,
      defaults.DynamoEventSourceProps(props.dynamoEventSourceProps)));
  }

  /**
   * @summary Retruns an instance of dynamodb.Table created by the construct.
   * @returns {dynamodb.Table} Instance of dynamodb.Table created by the construct
   * @since 0.8.0
   * @access public
   */
  public dynamoTable(): dynamodb.Table {
    return this.table;
  }

  /**
   * @summary Retruns an instance of lambda.Function created by the construct.
   * @returns {lambda.Function} Instance of lambda.Function created by the construct
   * @since 0.8.0
   * @access public
   */
  public lambdaFunction(): lambda.Function {
    return this.fn;
  }

}