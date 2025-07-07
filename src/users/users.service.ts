import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '../auth/interfaces';

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async findByEmail(email: string): Promise<User | null> {
    const response = await this.supabase.from('users').select('*').eq('email', email).single();

    if (response.error) {
      return null;
    }

    return response.data as User;
  }

  async findById(id: string): Promise<User | null> {
    const response = await this.supabase.from('users').select('*').eq('id', id).single();

    if (response.error) {
      return null;
    }

    return response.data as User;
  }
}
