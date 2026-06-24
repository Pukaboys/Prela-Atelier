import api from './api';
import type { ApiResponse, PromoValidatePayload, PromoValidateResult } from '../types';

type PromoApiPayload = ApiResponse<PromoValidateResult> | (PromoValidateResult & { code?: string });

function normalizePromoResponse(payload: PromoApiPayload): PromoValidateResult {
  if ('data' in payload && payload.data) {
    return payload.data;
  }

  if ('code' in payload && payload.code) {
    return {
      valid: true,
      code: payload.code,
      type: payload.type,
      value: payload.value,
      discount: payload.discount,
    };
  }

  return {
    valid: false,
    error: 'Invalid code',
  };
}

export async function validatePromoCode(
  payload: PromoValidatePayload,
): Promise<PromoValidateResult> {
  try {
    const { data } = await api.post<PromoApiPayload>('/api/promo/validate', payload);
    return normalizePromoResponse(data);
  } catch (err: any) {
    return { valid: false, error: err.message ?? 'Invalid code' };
  }
}

export async function removePromoCode(): Promise<void> {
  await api.post('/api/promo/remove');
}
