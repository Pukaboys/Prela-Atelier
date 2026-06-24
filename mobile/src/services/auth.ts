import api from './api';
import type { ApiResponse } from '../types';

type VerifyLoginCodeResult = {
  email: string;
  token: string;
};

export async function requestLoginCode(email: string): Promise<void> {
  const { data } = await api.post<ApiResponse>('/api/auth/mobile/request-code', { email });

  if (!data.success) {
    throw new Error(data.error ?? 'Unable to send confirmation code');
  }
}

export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<VerifyLoginCodeResult> {
  const { data } = await api.post<ApiResponse<VerifyLoginCodeResult>>(
    '/api/auth/mobile/verify-code',
    { email, code },
  );

  if (data.success && data.data) {
    return data.data;
  }

  throw new Error(data.error ?? 'Unable to verify confirmation code');
}
