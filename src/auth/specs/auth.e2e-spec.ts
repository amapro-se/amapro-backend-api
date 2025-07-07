import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/auth/signup (POST)', () => {
    it('올바른 idToken으로 회원가입을 처리해야 합니다', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          idToken: 'valid-google-token'
        })
        .expect((res) => {
          // 실제 Google 토큰 없이는 400 에러가 예상됩니다
          expect(res.status).toBe(400);
          expect(res.body).toHaveProperty('message');
          const message = res.body.message;
          expect(typeof message).toBe('string');
          expect(message).toContain('Google token verification failed');
        });
    });

    it('idToken이 없을 때 400 에러를 반환해야 합니다', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          const message = res.body.message;
          expect(typeof message).toBe('string');
          expect(message).toContain('idToken should not be empty');
        });
    });

    it('잘못된 형식의 요청일 때 400 에러를 반환해야 합니다', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          idToken: 123 // 숫자로 보내서 검증 실패 유도
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('올바른 idToken으로 로그인을 처리해야 합니다', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          idToken: 'valid-google-token'
        })
        .expect((res) => {
          // 실제 Google 토큰 없이는 400 에러가 예상됩니다
          expect(res.status).toBe(400);
          expect(res.body).toHaveProperty('message');
          const message = res.body.message;
          expect(typeof message).toBe('string');
          expect(message).toContain('Google token verification failed');
        });
    });

    it('idToken이 없을 때 400 에러를 반환해야 합니다', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          const message = res.body.message;
          expect(typeof message).toBe('string');
          expect(message).toContain('idToken should not be empty');
        });
    });
  });

  describe('/profile (GET)', () => {
    it('인증 토큰 없이 접근할 때 401 에러를 반환해야 합니다', () => {
      return request(app.getHttpServer()).get('/profile').expect(401);
    });

    it('잘못된 토큰으로 접근할 때 401 에러를 반환해야 합니다', () => {
      return request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
