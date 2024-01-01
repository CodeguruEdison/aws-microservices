import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface ISwnApiGatewayProps {
  productMicroService: IFunction;
}
export class SwnApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: ISwnApiGatewayProps) {
    super(scope, id);
    const { productMicroService } = props;
    // Product API Gateway
    // rootName: 'product',
    // handler: productFunction,
    const apigw = new LambdaRestApi(this, "productApi", {
      handler: productMicroService,
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
