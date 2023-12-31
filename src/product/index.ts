import { APIGatewayEvent, Context } from "aws-lambda";
import { ddbClient } from "./ddbClient";
import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

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
      case "PUT":
        body = await handlePutRequest(event);
        break;
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

  if (pathParameters && pathParameters.id) {
    if (queryStringParameters) {
      return getProductByCategory({
        id: pathParameters.id,
        category: queryStringParameters.category || "",
      });
    } else {
      return getProductById(pathParameters.id);
    }
  } else {
    return getAllProducts();
  }
}

async function handlePostRequest(event: APIGatewayEvent) {
  return createProduct(event);
}

async function handlePutRequest(event: APIGatewayEvent) {
  return updateProduct(event);
}

async function handleDeleteRequest(event: APIGatewayEvent) {
  const { pathParameters } = event;

  if (!pathParameters || !pathParameters.id) {
    throw new Error(`Missing path parameter id`);
  }
  return deleteProduct(pathParameters.id);
}

const updateProduct = async (event: APIGatewayEvent) => {
  console.log("updateProduct", event);
  const { pathParameters } = event;
  if (!pathParameters || !pathParameters.id) {
    throw new Error(`Missing path parameter id`);
  }
  try {
    const updateProductRequest = JSON.parse(event.body || "{}");
    const objectKeys = Object.keys(updateProductRequest).filter(
      (key) => key !== "id"
    );
    console.log(
      `updateProduction function.requestBody, ${updateProductRequest}, objectKeys: ${objectKeys}`
    );

    const params: UpdateItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: pathParameters.id }),
      UpdateExpression: `SET ${objectKeys
        .map((key) => `#${key} = :${key}`)
        .join(", ")}`,
      ExpressionAttributeValues: marshall(
        objectKeys.reduce((acc, key) => {
          acc[`:${key}`] = updateProductRequest[key];
          return acc;
        }, {} as Record<string, unknown>),
        { removeUndefinedValues: true }
      ),
      ExpressionAttributeNames: objectKeys.reduce((acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      }, {} as Record<string, string>),
      //ReturnValues: "ALL_NEW",
    };
    console.log("params", params);
    const updateItemCommand = new UpdateItemCommand(params);
    const updateResult = await ddbClient.send(updateItemCommand);
    console.log("updateResult", updateResult);
    return updateResult;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
/***
 *  getProductsbyId
 */
const getProductById = async (id: string) => {
  console.log("getPropductById", id);
  try {
    const params: GetItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id }),
    };
    const { Item } = await ddbClient.send(new GetItemCommand(params));
    console.log("Item", Item);
    return Item ? unmarshall(Item) : {};
  } catch (err) {
    console.log(err);
    throw err;
  }
};
const deleteProduct = async (productId: string) => {
  console.log("deleteProduct", productId);
  try {
    const params: DeleteItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: productId }),
    };
    const deleteItemCommand = new DeleteItemCommand(params);
    const deleteResult = await ddbClient.send(deleteItemCommand);
    console.log("deleteResult", deleteResult);

    return deleteResult;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const createProduct = async (event: APIGatewayEvent) => {
  try {
    const productRequest = JSON.parse(event.body || "{}");
    console.log("createProduct", productRequest);
    const productId = uuidv4();
    productRequest.id = productId;
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(productRequest || {}),
    };
    const putItemCommand = new PutItemCommand(params);
    const createResult = await ddbClient.send(putItemCommand);
    console.log("createResult", createResult);
    return createResult;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
/***
 *  getAllProducts
 */
const getAllProducts = async () => {
  console.log("getAllProducts");
  try {
    const params: ScanCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };
    const command = new ScanCommand(params);
    const response = await ddbClient.send(command);
    console.log("response", response);
    return response.Items ? response.Items.map((item) => unmarshall(item)) : {};
  } catch (err) {
    console.log(err);
    throw err;
  }
};
const getProductByCategory = async (querySearchParams: {
  id: string;
  category: string;
}) => {
  const { id, category } = querySearchParams;
  console.log("getProductByCategory", JSON.stringify(querySearchParams));
  try {
    const params: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME as string,
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id": "id", // Replace with the actual name of your partition key attribute
      },
      ExpressionAttributeValues: {
        ":id": { S: id },
        ":category": { S: category },
      },
      FilterExpression: "contains (category, :category)",
    };
    const queryCommand = new QueryCommand(params);

    const { Items } = await ddbClient.send(queryCommand);
    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (err) {
    console.log(err);
    throw err;
  }
};
