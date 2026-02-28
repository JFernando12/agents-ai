import { ApiService } from './api';

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: string;
  account_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface UpdateUserPayload {
  name?: string;
  role?: 'admin' | 'editor' | 'viewer';
  status?: 'active' | 'inactive';
}

class AccountsApiService extends ApiService {
  // ---- Users within an account ----
  async getUsers(accountId: string): Promise<AccountUser[]> {
    const res = await this.api.get<{ success: boolean; data: AccountUser[] }>(
      `/accounts/${accountId}/users`
    );
    return res.data.data;
  }

  async createUser(accountId: string, payload: CreateUserPayload): Promise<AccountUser> {
    const res = await this.api.post<{ success: boolean; data: AccountUser }>(
      `/accounts/${accountId}/users`,
      payload
    );
    return res.data.data;
  }

  async updateUser(accountId: string, userId: string, payload: UpdateUserPayload): Promise<void> {
    await this.api.put(`/accounts/${accountId}/users/${userId}`, payload);
  }

  async deleteUser(accountId: string, userId: string): Promise<void> {
    await this.api.delete(`/accounts/${accountId}/users/${userId}`);
  }

  async resetUserPassword(accountId: string, userId: string, newPassword: string): Promise<void> {
    await this.api.post(`/accounts/${accountId}/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
  }

  // ---- Account info ----
  async getMyAccount(): Promise<{ id: string; name: string; slug: string; plan: string; status: string; owner_email: string }> {
    const res = await this.api.get(`/accounts/me`);
    return (res.data as any).data;
  }

  async updateMyAccount(payload: { name: string }): Promise<void> {
    await this.api.put(`/accounts/me`, payload);
  }
}

export const accountsApi = new AccountsApiService();
