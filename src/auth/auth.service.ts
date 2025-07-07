import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SignupDto, AuthResponseDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GooglePayload, User } from './interfaces';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private googleClient: OAuth2Client;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!supabaseUrl || !supabaseKey || !googleClientId) {
      throw new Error('Required environment variables are missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.googleClient = new OAuth2Client(googleClientId);
  }

  async verifyGoogleToken(idToken: string): Promise<GooglePayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID')
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email || !payload.name || !payload.picture) {
        throw new BadRequestException('Invalid Google token payload');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Google token verification failed:', error);
      throw new BadRequestException('Google token verification failed');
    }
  }

  async register(signupDto: SignupDto): Promise<AuthResponseDto> {
    const googlePayload = await this.verifyGoogleToken(signupDto.idToken);

    // 기존 사용자 확인
    const existingUserResponse = await this.supabase
      .from('users')
      .select('*')
      .eq('email', googlePayload.email)
      .single();

    const existingUser = existingUserResponse.data as User | null;

    if (existingUser) {
      throw new ConflictException('이미 가입된 이메일입니다');
    }

    // 새 사용자 생성
    const newUserResponse = await this.supabase
      .from('users')
      .insert([
        {
          provider: 'google',
          provider_id: googlePayload.sub,
          email: googlePayload.email,
          name: googlePayload.name,
          picture: googlePayload.picture
        }
      ])
      .select()
      .single();

    const newUser = newUserResponse.data as User | null;

    if (newUserResponse.error || !newUser) {
      throw new BadRequestException('사용자 생성에 실패했습니다');
    }

    const tokens = await this.issueTokens(newUser.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        picture: newUser.picture
      }
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const googlePayload = await this.verifyGoogleToken(loginDto.idToken);

    // 기존 사용자 확인
    const existingUserResponse = await this.supabase
      .from('users')
      .select('*')
      .eq('email', googlePayload.email)
      .single();

    const existingUser = existingUserResponse.data as User | null;

    if (!existingUser) {
      throw new NotFoundException('가입되지 않은 이메일입니다');
    }

    const tokens = await this.issueTokens(existingUser.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        picture: existingUser.picture
      }
    };
  }

  async issueTokens(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION')
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION')
    });

    // 리프레시 토큰을 데이터베이스에 저장
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

    await this.supabase.from('refresh_tokens').insert([
      {
        user_id: userId,
        token: refreshToken,
        expires_at: expiresAt.toISOString()
      }
    ]);

    return {
      accessToken,
      refreshToken
    };
  }
}
