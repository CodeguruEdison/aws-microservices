import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { create } from "domain";

interface ISwnApiGatewayProps {
  productMicroService: NodejsFunction;
  basketMicroService: NodejsFunction;
  orderMicroService: NodejsFunction;
}
export class SwnApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: ISwnApiGatewayProps) {
    super(scope, id);
    const { productMicroService, basketMicroService, orderMicroService } =
      props;

    this.createProductMicroService(productMicroService);

    this.createBasketMicroService(basketMicroService);
    this.createOrderMicroService(orderMicroService);
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

    const basketCheckout = basket.addResource("checkout");
    basketCheckout.addMethod("POST");
  };
  // order microservices
  // route name: order
  // GET /order/{userName}
  // GET /order

  createOrderMicroService = (orderMicroServices: IFunction) => {
    const apigw = new LambdaRestApi(this, "orderApi", {
      handler: orderMicroServices,
      proxy: false,
    });
    const order = apigw.root.addResource("order");
    order.addMethod("GET");

    const singleOrder = order.addResource("{userName}");
    singleOrder.addMethod("GET"); //GET /order/{id}
  };
}
