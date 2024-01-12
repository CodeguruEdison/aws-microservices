import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { SwnDatabase } from "./database";
import { SwnMicroservices } from "./micro-services";
import { SwnApiGateway } from "./apigateway";
import { SwnEventBus } from "./eventbus";

// import * as sqs from 'aws-cdk-lib/aws-sqs';
// https://github.com/aws/aws-cdk/tree/main/packages/aws-cdk-lib/aws-dynamodb
export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // dynamodb
    const { productTable, basketTable, orderTable } = new SwnDatabase(
      this,
      "Database"
    );
    // microservices
    const { productMicroService, basketMicroService, orderMicroService } =
      new SwnMicroservices(this, "Microservices", {
        productTable: productTable,
        basketTable: basketTable,
        orderTable: orderTable,
      });
    // apigateway
    const apigw = new SwnApiGateway(this, "ApiGateway", {
      productMicroService: productMicroService,
      basketMicroService: basketMicroService,
      orderMicroService: orderMicroService,
    });

    // Event Bridge
    new SwnEventBus(this, "EventBus", {
      publisherFunction: basketMicroService,
      targetFunction: productMicroService,
    });
  }
}
