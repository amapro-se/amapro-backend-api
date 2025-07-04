import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn()
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/picture.jpg'
  };

  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      idToken: 'valid-google-token'
    };

    it('새로운 사용자를 성공적으로 등록해야 합니다', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.signup(signupDto);

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(signupDto);
    });

    it('잘못된 토큰일 때 BadRequestException을 발생시켜야 합니다', async () => {
      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Google token verification failed')
      );

      await expect(controller.signup(signupDto)).rejects.toThrow(BadRequestException);
    });

    it('이미 가입된 이메일일 때 ConflictException을 발생시켜야 합니다', async () => {
      mockAuthService.register.mockRejectedValue(new ConflictException('이미 가입된 이메일입니다'));

      await expect(controller.signup(signupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      idToken: 'valid-google-token'
    };

    it('기존 사용자 로그인을 성공적으로 처리해야 합니다', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('잘못된 토큰일 때 BadRequestException을 발생시켜야 합니다', async () => {
      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Google token verification failed')
      );

      await expect(controller.login(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('가입되지 않은 이메일일 때 NotFoundException을 발생시켜야 합니다', async () => {
      mockAuthService.login.mockRejectedValue(new NotFoundException('가입되지 않은 이메일입니다'));

      await expect(controller.login(loginDto)).rejects.toThrow(NotFoundException);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
