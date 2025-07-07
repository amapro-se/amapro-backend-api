import { createNestApplication } from './app.bootstrap';

async function bootstrap() {
  const app = await createNestApplication();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
