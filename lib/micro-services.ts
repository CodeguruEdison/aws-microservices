import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface ISwnMicroservicesProps {
  productTable: ITable;
  basketTable: ITable;
  orderTable: ITable;
}
/**
 * @description
 * @class
 * @implements {Construct}
 * @constructs
 * @param {Construct} scope - scope of the construct
 * @param {string} id - id of the construct
 * @param {ISwnMicroservicesProps} props - props of the construct
 * @returns {void}
 * @example
 * new SwnMicroservices(this, 'SwnMicroservices', {
 *  productTable: productTable,
 * });
 */
export class SwnMicroservices extends Construct {
  public readonly productMicroService: NodejsFunction;
  public readonly basketMicroService: NodejsFunction;
  public readonly orderMicroService: NodejsFunction;
  constructor(scope: Construct, id: string, props: ISwnMicroservicesProps) {
    super(scope, id);
    const { productTable, basketTable, orderTable } = props;
    // product mictoservices
    this.productMicroService = this.createProductMicroService(productTable);
    // basket microservices
    this.basketMicroService = this.createBasketMicroService(basketTable);
    // order microservices
    this.orderMicroService = this.createOrderMicroService(orderTable);
  }
  createBasketMicroService(basketTable: ITable): NodejsFunction {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "userName",
        DYNAMODB_TABLE_NAME: basketTable.tableName,
      },
      runtime: Runtime.NODEJS_20_X,
    };
    const basketFunction = new NodejsFunction(this, "basketLamdaFunction", {
      entry: join(__dirname, "/../src/basket", "index.ts"),
      functionName: "basketFuntion",
      ...nodeJsFunctionProps,
    });

    basketTable.grantReadWriteData(basketFunction);
    return basketFunction;
  }
  private createProductMicroService(productTable: ITable): NodejsFunction {
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
      entry: join(__dirname, "/../src/product", "index.ts"),
      functionName: "productFuntion",
      ...nodeJsFunctionProps,
    });

    productTable.grantReadWriteData(productFunction);
    return productFunction;
  }
  private createOrderMicroService(orderTable: ITable): NodejsFunction {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      runtime: Runtime.NODEJS_20_X,
    };
    const orderFunction = new NodejsFunction(this, "orderLamdaFunction", {
      entry: join(__dirname, "/../src/ordering", "index.ts"),
      functionName: "orderFuntion",
      ...nodeJsFunctionProps,
    });
    orderTable.grantReadWriteData(orderFunction);
    return orderFunction;
  }
}
