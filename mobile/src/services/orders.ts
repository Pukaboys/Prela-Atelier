import api from './api';
import type {
  ApiResponse,
  CheckoutPayload,
  OrderConfirmedData,
  OrderTrackResult,
  ClientOrder,
  Currency,
} from '../types';

interface CheckoutApiPayload extends ApiResponse<OrderConfirmedData> {
  orderCode?: string;
  total?: number;
  currency?: Currency;
}

interface TrackOrderItemPayload {
  name: string;
  quantity: number;
  subtotal?: number;
  price?: number;
}

interface TrackOrderApiPayload extends ApiResponse<OrderTrackResult> {
  order?: {
    orderCode: string;
    status: OrderTrackResult['status'];
    createdAt: string;
    updatedAt?: string;
    address?: string;
    city?: string;
    postcode?: string;
    country?: string;
    total: number;
    currency?: Currency;
    items: TrackOrderItemPayload[];
  };
}

interface CustomerOrdersApiPayload extends ApiResponse<ClientOrder[]> {}

function checkoutFallbackTotal(payload: CheckoutPayload) {
  return payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function submitCheckout(
  payload: CheckoutPayload,
): Promise<OrderConfirmedData> {
  const { data } = await api.post<CheckoutApiPayload>('/api/checkout', payload);
  const orderData = data.data;

  if (orderData) {
    return orderData;
  }

  if (data.success && data.orderCode) {
    return {
      orderCode: data.orderCode,
      total: data.total ?? checkoutFallbackTotal(payload),
      currency: data.currency ?? payload.currency,
    };
  }

  throw new Error(data.error ?? 'Checkout failed');
}

export async function fetchCustomerOrders(email: string): Promise<ClientOrder[]> {
  const { data } = await api.post<CustomerOrdersApiPayload>('/api/orders', { email });

  if (data.success && data.data) {
    return data.data;
  }

  throw new Error(data.error ?? 'Unable to fetch orders');
}

export async function trackOrder(
  orderCode: string,
  email: string,
): Promise<OrderTrackResult> {
  const { data } = await api.post<TrackOrderApiPayload>('/api/track-order', {
    orderCode,
    email,
  });

  if (data.data) {
    return data.data;
  }

  if (data.success && data.order) {
    const order = data.order;
    const shippingAddress = [order.address, order.city, order.postcode, order.country]
      .filter(Boolean)
      .join(', ');

    return {
      orderCode: order.orderCode,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt ?? order.createdAt,
      shippingAddress,
      total: order.total,
      currency: order.currency ?? 'EUR',
      items: order.items.map((item: TrackOrderItemPayload) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price ?? item.subtotal ?? 0,
      })),
    };
  }

  throw new Error(data.error ?? 'Order not found');
}
