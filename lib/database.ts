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
  public readonly basketTable: ITable;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);
    // Product Table
    this.productTable = this.createProductTable();
    //
    this.basketTable = this.createBasketTable();
  }
  private createProductTable(): ITable {
    const productTable = new Table(this, "ProductTable", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: "product",
    });
    return productTable;
  }
  private createBasketTable(): ITable {
    // Basket Table
    // basket id- user id, basketItemList
    //basket: PK : userName -- items(SET MAP object)
    //item1 -{quantity,color,price,productId,productName}

    const basketTable = new Table(this, "BasketTable", {
      partitionKey: { name: "userName", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: "basket",
    });
    return basketTable;
  }
}
