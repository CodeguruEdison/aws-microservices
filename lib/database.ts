import { RemovalPolicy, StackProps } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  ITable,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class SwnDatabase extends Construct {
  public readonly productTable: ITable;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);
    // Product Table
    const productTable = new Table(this, "ProductTable", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: "product",
    });
    this.productTable = productTable;
  }
}
