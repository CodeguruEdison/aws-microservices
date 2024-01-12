import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

interface ISwnEventBusProps {
  publisherFunction: NodejsFunction;
  targetFunction: NodejsFunction;
}

export class SwnEventBus extends Construct {
  // public
  private publisherFunction: NodejsFunction;
  private targetFunction: NodejsFunction;
  constructor(scope: Construct, id: string, props: ISwnEventBusProps) {
    super(scope, id);
    this.publisherFunction = props.publisherFunction;
    this.targetFunction = props.targetFunction;
    // Event Bus
    const eventBus = new EventBus(this, "EventBus", {
      eventBusName: "SwnEventBus",
    });
    // Event Bridge Rule
    const checkoutBasketRule = new Rule(this, "CheckoutBasketRule", {
      eventBus: eventBus,
      enabled: true,
      description: "Checkout Basket Rule",
      eventPattern: {
        source: ["com.swn.basket.checkoutbasket"],
        detailType: ["CheckoutBasketRule"],
      },
      ruleName: "CheckoutBasketRule",
    });
    // Event Target
    checkoutBasketRule.addTarget(new LambdaFunction(this.targetFunction));
    eventBus.grantPutEventsTo(this.publisherFunction);
  }
}
