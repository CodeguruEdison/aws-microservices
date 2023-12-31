import { APIGatewayEvent, Context } from "aws-lambda";
import { ddbClient } from "./ddbClient";
import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  ScanCommand,
  ScanCommandInput,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event: APIGatewayEvent, context: Context) => {
  console.log("event", JSON.stringify(event, undefined, 2));
  const { httpMethod, pathParameters } = event;
  let body;
  switch (httpMethod) {
    case "GET": // GET /product/{id}
      if (pathParameters !== null && pathParameters.id !== undefined) {
        body = await getProductById(pathParameters.id);
      } else {
        body = await getAllProducts();
      }

    case "POST": // Post /product
      body = await createProduct(event);

    case "PUT": // PUT /product/{id}
      body = await updateProduct(event);
    case "DELETE": // DELETE /product/{id}
      if (pathParameters === null || pathParameters.id === undefined) {
        throw new Error(`Missing path parameter id`);
      }
      body = deleteProduct(pathParameters.id);
    default:
      throw new Error(`Unsupported method "${httpMethod}"`);
  }
};

const updateProduct = async (event: APIGatewayEvent) => {
  console.log("updateProduct", event);
  try {
    const updateProductRequest = JSON.parse(event.body || "{}");
    const objectKeys = Object.keys(updateProductRequest);
    console.log(
      `updateProduction function.requestBody, ${updateProductRequest}, objectKeys: ${objectKeys}`
    );

    const params: UpdateItemCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: updateProductRequest.id }),
      UpdateExpression: `SET ${objectKeys
        .map((key) => `#${key} = :${key}`)
        .join(", ")}`,
      ExpressionAttributeValues: marshall(
        objectKeys.reduce((acc, key) => {
          acc[`:${key}`] = updateProductRequest[key];
          return acc;
        }, {} as Record<string, unknown>)
      ),
      ExpressionAttributeNames: objectKeys.reduce((acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      }, {} as Record<string, string>),
      ReturnValues: "ALL_NEW",
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
