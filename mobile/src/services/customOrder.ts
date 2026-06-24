import api from './api';
import type {
  ApiResponse,
  CustomOrderCalculatePayload,
  CustomOrderQuote,
  BespokeEnquiryPayload,
} from '../types';

type WebsiteCustomQuote = {
  widthCm: number;
  heightCm: number;
  thicknessCm?: number | null;
  quantity?: number;
  materialId?: number;
  materialName: string;
  areaM2?: number;
  totalAreaM2?: number;
  estimatedPrice?: number;
  totalEstimatedPrice?: number;
  currency?: CustomOrderQuote['currency'];
  leadTimeWeeks?: number;
};

type CustomOrderApiPayload =
  | ApiResponse<CustomOrderQuote | WebsiteCustomQuote>
  | {
      ok?: boolean;
      success?: boolean;
      quote?: WebsiteCustomQuote;
      data?: CustomOrderQuote | WebsiteCustomQuote;
      error?: string;
    };

function normalizeQuote(
  payload: CustomOrderApiPayload,
  currency: CustomOrderQuote['currency'],
): CustomOrderQuote {
  const quote = ('data' in payload && payload.data) || ('quote' in payload && payload.quote);

  if (!quote) {
    throw new Error(('error' in payload && payload.error) || 'Could not calculate estimate');
  }

  const normalizedQuote = quote as CustomOrderQuote & Partial<WebsiteCustomQuote>;

  return {
    estimatedPrice: normalizedQuote.estimatedPrice ?? normalizedQuote.totalEstimatedPrice ?? 0,
    currency: normalizedQuote.currency ?? currency,
    widthCm: normalizedQuote.widthCm,
    heightCm: normalizedQuote.heightCm,
    materialName: normalizedQuote.materialName,
    leadTimeWeeks: normalizedQuote.leadTimeWeeks ?? 6,
  };
}

export async function calculateCustomOrder(
  payload: CustomOrderCalculatePayload,
): Promise<CustomOrderQuote> {
  const { data } = await api.post<CustomOrderApiPayload>(
    '/api/custom-order/calculate',
    {
      ...payload,
      quantity: payload.quantity ?? 1,
      thicknessCm: payload.thicknessCm ?? null,
    },
  );

  return normalizeQuote(data, payload.currency);
}

function buildWebsiteBespokePayload(payload: BespokeEnquiryPayload) {
  const description = [
    'Mobile custom order enquiry',
    `Dimensions: ${payload.widthCm} x ${payload.heightCm} cm`,
    `Material ID: ${payload.materialId}`,
    payload.estimatedPrice ? `Estimated price: ${payload.currency} ${payload.estimatedPrice}` : null,
    payload.phone ? `Phone: ${payload.phone}` : null,
    payload.notes ? `Notes: ${payload.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    name: payload.name,
    email: payload.email,
    type: 'Custom mobile order',
    budget: payload.estimatedPrice ? `${payload.currency} ${payload.estimatedPrice}` : '',
    description,
    timeline: 'Requested from mobile app',
  };
}

export async function submitBespokeEnquiry(
  payload: BespokeEnquiryPayload,
): Promise<void> {
  const { data } = await api.post<ApiResponse | { ok?: boolean; success?: boolean; error?: string }>(
    '/api/bespoke',
    buildWebsiteBespokePayload(payload),
  );

  if ('ok' in data && data.ok) return;
  if ('success' in data && data.success) return;

  throw new Error(data.error ?? 'Could not submit enquiry');
}
