import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

interface ISwnApiGatewayProps {
  productMicroService: NodejsFunction;
  basketMicroService: NodejsFunction;
}
export class SwnApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: ISwnApiGatewayProps) {
    super(scope, id);
    const { productMicroService, basketMicroService } = props;
    this.createProductMicroService(productMicroService);
    this.createBasketMicroService(basketMicroService);
  }

  createProductMicroService = (productMicroService: IFunction) => {
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
  };
  createBasketMicroService = (basketMicroService: IFunction) => {
    const apigw = new LambdaRestApi(this, "basketApi", {
      handler: basketMicroService,
      proxy: false,
    });
    const basket = apigw.root.addResource("basket");
    basket.addMethod("GET");
    basket.addMethod("POST");

    // basket/{id  GET }
    const singleBasket = basket.addResource("{userName}");
    singleBasket.addMethod("GET"); //GET /basket/{id}
    singleBasket.addMethod("PUT"); //PUT /basket/{id}
    singleBasket.addMethod("DELETE"); //DELETE /basket/{id}
  };
}
