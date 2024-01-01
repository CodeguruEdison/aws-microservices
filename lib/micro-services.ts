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
  constructor(scope: Construct, id: string, props: ISwnMicroservicesProps) {
    super(scope, id);
    const { productTable } = props;
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
    this.productMicroService = productFunction;
  }
}
