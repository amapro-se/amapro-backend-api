import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { configure as serverlessExpress } from '@codegenie/serverless-express';
import { createNestApplication } from './app.bootstrap';

let cachedHandler: ReturnType<typeof serverlessExpress>;

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: any,
  callback: () => void,
) => {
  if (!cachedHandler) {
    const app = await createNestApplication();
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    cachedHandler = serverlessExpress({ app: expressApp });
  }
  return cachedHandler(event, context, callback);
};
