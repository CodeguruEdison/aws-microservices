import { APIGatewayEvent, APIGatewayProxyEvent, Context } from "aws-lambda";
import { ddbClient } from "../product/ddbClient";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";

export const handler = async (event: APIGatewayEvent, context: Context) => {
  console.log("event", JSON.stringify(event, undefined, 2));
  try {
    const { httpMethod } = event;
    let body;
    switch (httpMethod) {
      case "GET":
        body = await handleGetRequest(event);
        break;

      case "POST":
        body = await handlePostRequest(event);
        break;
      //   case "PUT":
      //     body = await handlePutRequest(event);
      //     break;
      case "DELETE":
        body = await handleDeleteRequest(event);
        break;
      default:
        throw new Error(`Unsupported method "${httpMethod}"`);
    }
    console.log("body", body);
    return {
      statusCode: 200,

      body: JSON.stringify({
        message: "Success",
        data: body,
      }),
    };
  } catch (err) {
    console.error(err);

    // Check if 'err' is an instance of Error
    const isError = err instanceof Error;
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Internal Server Error",
        errorMessage: isError ? err.message : "An unknown error occurred",
        errorStack: isError ? err.stack : null,
      }),
    };
  }
};
async function handleGetRequest(event: APIGatewayEvent) {
  const { pathParameters, queryStringParameters } = event;
  if (pathParameters && pathParameters.userName) {
    return getBasketByUserName({
      userName: pathParameters.userName,
    });
  } else {
    return getAllBaskets();
  }
}

async function handlePostRequest(event: APIGatewayEvent) {
  const { path, pathParameters } = event;
  if (path === "/basket/checkout") {
    return checkoutBasket(event);
  } else {
    return createBasket(event);
  }
}

async function handleDeleteRequest(event: APIGatewayEvent) {
  return deleteBasket(event?.pathParameters?.userName || "");
}
async function getBasketByUserName(user: { userName: string }) {
  console.log("getBasketByUserName");
  try {
    const { userName } = user;
    const params: GetItemCommandInput = {
      TableName: process.env.BASKET_TABLE_NAME,
      Key: marshall({ userName: userName }),
    };
    const command = new GetItemCommand(params);
    const { Item } = await ddbClient.send(command);
    console.log("Item", Item);
    return Item ? unmarshall(Item) : {};
  } catch (error) {
    console.log(error);
    throw error;
  }
}
async function getAllBaskets() {
  console.log("getAllBaskets");
  try {
    const params: ScanCommandInput = {
      TableName: "Basket",
    };
    const command = new ScanCommand(params);
    const response = await ddbClient.send(command);
    console.log("response", response);
    return response.Items
      ? response.Items?.map((item) => unmarshall(item))
      : {};
  } catch (error) {
    console.log(error);
    throw error;
  }
}
async function checkoutBasket(event: APIGatewayProxyEvent) {
  throw new Error("Function not implemented.");

  // publish an event to event Bridge -this will be picked up by the order service
}

async function createBasket(event: APIGatewayEvent) {
  console.log("createBasket");
  try {
    const basketRequest = JSON.parse(event.body || "{}");
    console.log("createBasket", basketRequest);
    const params = {
      TableName: process.env.BASKET_TABLE_NAME,
      Item: marshall(basketRequest || {}),
    };
    const command = new PutItemCommand(params);
    const createResult = await ddbClient.send(command);
    console.log("createResult", createResult);
    return createResult;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function deleteBasket(userName: string) {
  console.log("deleteBasket");
  try {
    const params: DeleteItemCommandInput = {
      TableName: process.env.BASKET_TABLE_NAME,
      Key: marshall({ userName: userName }),
    };
    const command = new DeleteItemCommand(params);
    const deleteResult = await ddbClient.send(command);
    console.log("deleteResult", deleteResult);
    return deleteResult;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
