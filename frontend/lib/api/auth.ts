import { ApiService } from './api';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  account_name: string;
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  account_id: string;
}

class AuthApiService extends ApiService {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await this.api.post<{ success: boolean; data: AuthResponse }>('/auth/login', payload);
    return res.data.data;
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await this.api.post<{ success: boolean; data: AuthResponse }>('/auth/register', payload);
    return res.data.data;
  }
}

export const authApi = new AuthApiService();
