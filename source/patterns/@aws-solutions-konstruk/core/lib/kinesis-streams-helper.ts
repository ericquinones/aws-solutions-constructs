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
import * as kinesis from '@aws-cdk/aws-kinesis';
import * as kms from '@aws-cdk/aws-kms';
import { DefaultStreamProps } from './kinesis-streams-defaults';
import * as cdk from '@aws-cdk/core';
import { overrideProps } from './utils';

export interface BuildKinesisStreamProps {
  /**
   * Optional external encryption key to use for stream encryption.
   *
   * @default - Default props are used.
   */
  readonly encryptionKey?: kms.Key
  /**
   * Optional user provided props to override the default props for the Kinesis stream.
   *
   * @default - Default props are used.
   */
  readonly kinesisStreamProps?: kinesis.StreamProps | any
}

export function buildKinesisStream(scope: cdk.Construct, props?: BuildKinesisStreamProps): kinesis.Stream {
    // If props is undefined, define it
    props = (props === undefined) ? {} : props;
    // Setup the stream properties
    let kinesisStreamProps;
    if (props.hasOwnProperty('kinesisStreamProps')) {
        // If property overrides have been provided, incorporate them and deploy
        kinesisStreamProps = overrideProps(DefaultStreamProps, props.kinesisStreamProps);
    } else {
        // If no property overrides, deploy using the default configuration
        kinesisStreamProps = DefaultStreamProps;
    }
    // Set conditional stream encryption properties
    if (!kinesisStreamProps.hasOwnProperty('encryptionKey') && props.hasOwnProperty('kinesisStreamProps')) {
        kinesisStreamProps.encryptionKey = props.encryptionKey;
    }
    // Create the stream and return
    return new kinesis.Stream(scope, 'KinesisStream', kinesisStreamProps);
}