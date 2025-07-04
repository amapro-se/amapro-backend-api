import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * 네스트 애플리케이션 생성
 */
export async function createNestApplication() {
  const app = await NestFactory.create(AppModule);

  // 전역 Validation Pipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  // CORS 설정
  app.enableCors();

  return app;
}
