import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


/**
 * 네스트 애플리케이션 생성
 */
export async function createNestApplication() {
  const app = await NestFactory.create(AppModule);
  // 공통 미들웨어, CORS 등 설정
  return app;
}
