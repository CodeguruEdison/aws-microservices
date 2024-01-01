import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";
import { SwnDatabase } from "./database";
import { SwnMicroservices } from "./micro-services";
import { SwnApiGateway } from "./apigateway";

// import * as sqs from 'aws-cdk-lib/aws-sqs';
// https://github.com/aws/aws-cdk/tree/main/packages/aws-cdk-lib/aws-dynamodb
export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { productTable } = new SwnDatabase(this, "Database");
    const { productMicroService } = new SwnMicroservices(
      this,
      "Microservices",
      {
        productTable: productTable,
      }
    );
    const apigw = new SwnApiGateway(this, "ApiGateway", {
      productMicroService: productMicroService,
    });
  }
}
