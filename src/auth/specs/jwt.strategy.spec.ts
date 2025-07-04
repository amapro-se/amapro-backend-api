import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../strategies/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret'
              };
              return config[key];
            })
          }
        }
      ]
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validate', () => {
    it('유효한 JWT payload를 검증해야 합니다', async () => {
      const payload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'test-user-id',
        email: 'test@example.com'
      });
    });

    it('다른 payload 형식도 처리해야 합니다', async () => {
      const payload = {
        sub: 'another-user-id',
        email: 'another@example.com',
        additionalField: 'should-be-ignored'
      };

      const result = await strategy.validate(payload);

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

      expect(() => {
        new JwtStrategy(mockConfigService as any);
      }).toThrow('JWT_SECRET is required');
    });
  });
});
