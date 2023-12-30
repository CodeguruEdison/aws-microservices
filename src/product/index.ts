import { APIGatewayEvent, Context } from "aws-lambda";

export const handler = async (event:APIGatewayEvent, context:Context) => {
    console.log("event", JSON.stringify(event,undefined,2));
    console.log("context", context);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Hello from product, You have hit ${event.path}\n`
        })
    };

}


