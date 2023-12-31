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

// import * as sqs from 'aws-cdk-lib/aws-sqs';
// https://github.com/aws/aws-cdk/tree/main/packages/aws-cdk-lib/aws-dynamodb
export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // Product Table
    const productTable = new Table(this, "ProductTable", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: "product",
    });
    //Product Lambda Function
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "id",
        DYNAMODB_TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_20_X,
    };
    const productFunction = new NodejsFunction(this, "productLamdaFunction", {
      // entry:join(__dirname,'../src/product','index.ts'),
      entry: join(__dirname, "/../src/product", "index.ts"),
      functionName: "productFuntion",
      ...nodeJsFunctionProps,
    });

    productTable.grantReadWriteData(productFunction);

    // Product API Gateway
    // rootName: 'product',
    // handler: productFunction,
    const apigw = new LambdaRestApi(this, "productApi", {
      handler: productFunction,
      proxy: false,
    });
    const product = apigw.root.addResource("product");
    product.addMethod("GET");
    product.addMethod("POST");

    // product/{id  GET }
    const singleProduct = product.addResource("{id}");
    singleProduct.addMethod("GET"); //GET /product/{id}
    singleProduct.addMethod("PUT"); //PUT /product/{id}
    singleProduct.addMethod("DELETE"); //DELETE /product/{id}
  }
}
