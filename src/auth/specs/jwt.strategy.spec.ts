import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../strategies/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret'
              };
              return config[key];
            })
          }
        }
      ]
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('유효한 JWT payload를 검증해야 합니다', () => {
      const payload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'test-user-id',
        email: 'test@example.com'
      });
    });

    it('다른 payload 형식도 처리해야 합니다', () => {
      const payload = {
        sub: 'another-user-id',
        email: 'another@example.com',
        additionalField: 'should-be-ignored'
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'another-user-id',
        email: 'another@example.com'
      });
    });
  });

  describe('constructor', () => {
    it('JWT_SECRET이 없을 때 에러를 발생시켜야 합니다', () => {
      const mockConfigService = {
        get: jest.fn(() => undefined)
      };

      // ConfigService 타입을 만족하는 mock 객체 생성
      const typedMockConfigService = mockConfigService as unknown as ConfigService;

      expect(() => {
        new JwtStrategy(typedMockConfigService);
      }).toThrow('JWT_SECRET is required');
    });
  });
});
