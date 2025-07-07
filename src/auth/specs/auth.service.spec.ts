import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';

// Mock 타입 정의
interface MockSupabase {
  from: jest.Mock;
}

interface MockGoogleClient {
  verifyIdToken: jest.Mock;
}

interface MockAuthService {
  supabase: MockSupabase;
  googleClient: MockGoogleClient;
}

// Mock 모듈들
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn()
  }))
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockSupabase: MockSupabase;

  const mockUser = {
    id: 'test-user-id',
    provider: 'google',
    provider_id: 'google-sub-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/picture.jpg',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockGooglePayload = {
    sub: 'google-sub-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/picture.jpg'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                SUPABASE_URL: 'https://test.supabase.co',
                SUPABASE_KEY: 'test-key',
                GOOGLE_CLIENT_ID: 'test-client-id',
                JWT_SECRET: 'test-secret',
                JWT_ACCESS_EXPIRATION: '3600s',
                JWT_REFRESH_EXPIRATION: '7d'
              };
              return config[key];
            })
          }
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    // Supabase 모킹
    mockSupabase = (service as unknown as MockAuthService).supabase;
  });

  describe('verifyGoogleToken', () => {
    it('유효한 Google 토큰을 검증해야 합니다', async () => {
      const mockTicket = {
        getPayload: jest.fn(() => mockGooglePayload)
      };

      const mockGoogleClient = (service as unknown as MockAuthService).googleClient;
      mockGoogleClient.verifyIdToken.mockResolvedValue(mockTicket);

      const result = await service.verifyGoogleToken('valid-token');

      expect(result).toEqual(mockGooglePayload);
      expect(mockGoogleClient.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-token',
        audience: 'test-client-id'
      });
    });

    it('잘못된 토큰일 때 BadRequestException을 발생시켜야 합니다', async () => {
      const mockGoogleClient = (service as unknown as MockAuthService).googleClient;
      mockGoogleClient.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyGoogleToken('invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('payload가 없을 때 BadRequestException을 발생시켜야 합니다', async () => {
      const mockTicket = {
        getPayload: jest.fn(() => null)
      };

      const mockGoogleClient = (service as unknown as MockAuthService).googleClient;
      mockGoogleClient.verifyIdToken.mockResolvedValue(mockTicket);

      await expect(service.verifyGoogleToken('token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('register', () => {
    const signupDto: SignupDto = {
      idToken: 'valid-token'
    };

    it('새로운 사용자를 성공적으로 등록해야 합니다', async () => {
      // Google 토큰 검증 모킹
      jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue(mockGooglePayload);

      // 기존 사용자 조회 (없음)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null })
          })
        })
      });

      // 새 사용자 생성
      const insertMock = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
        })
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null })
            })
          })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue(insertMock)
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({})
        });

      // JWT 토큰 생성
      const jwtSignSpy = jest.spyOn(jwtService, 'sign');
      jwtSignSpy.mockReturnValueOnce('mock-access-token');
      jwtSignSpy.mockReturnValueOnce('mock-refresh-token');

      const result = await service.register(signupDto);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          picture: mockUser.picture
        }
      });
    });

    it('이미 가입된 이메일일 때 ConflictException을 발생시켜야 합니다', async () => {
      jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue(mockGooglePayload);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser })
          })
        })
      });

      await expect(service.register(signupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      idToken: 'valid-token'
    };

    it('기존 사용자 로그인을 성공적으로 처리해야 합니다', async () => {
      jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue(mockGooglePayload);

      // 사용자 조회 모킹
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockUser })
          })
        })
      });

      // 리프레시 토큰 저장 모킹
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({})
      });

      const jwtSignSpy = jest.spyOn(jwtService, 'sign');
      jwtSignSpy.mockReturnValueOnce('mock-access-token');
      jwtSignSpy.mockReturnValueOnce('mock-refresh-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          picture: mockUser.picture
        }
      });
    });

    it('가입되지 않은 이메일일 때 NotFoundException을 발생시켜야 합니다', async () => {
      jest.spyOn(service, 'verifyGoogleToken').mockResolvedValue(mockGooglePayload);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null })
          })
        })
      });

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('issueTokens', () => {
    it('JWT 토큰을 성공적으로 발급해야 합니다', async () => {
      const jwtSignSpy = jest.spyOn(jwtService, 'sign');
      jwtSignSpy.mockReturnValueOnce('mock-access-token');
      jwtSignSpy.mockReturnValueOnce('mock-refresh-token');

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({})
      });

      const result = await service.issueTokens('test-user-id');

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      expect(jwtSignSpy).toHaveBeenCalledTimes(2);
    });
  });
});
