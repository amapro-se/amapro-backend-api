import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { configure as serverlessExpress } from '@codegenie/serverless-express';
import { createNestApplication } from './app.bootstrap';
import { INestApplication } from '@nestjs/common';
import { Express } from 'express';

let cachedHandler: ReturnType<typeof serverlessExpress>;

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: () => void
) => {
  if (!cachedHandler) {
    const app: INestApplication = await createNestApplication();
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance() as Express;
    cachedHandler = serverlessExpress({ app: expressApp });
  }

  const result = cachedHandler(event, context, callback);
  return result;
};
