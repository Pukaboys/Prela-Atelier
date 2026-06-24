import api, { API_BASE_URL } from './api';
import type { ApiResponse, ProductCardData, ProductDetail, Material, Currency } from '../types';

export interface ProductsQuery {
  featured?: boolean;
  materialSlug?: string;
  currency?: Currency;
  page?: number;
  limit?: number;
}

function unwrapData<T>(payload: ApiResponse<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiResponse<T>).data as T;
  }

  return payload as T;
}

function absoluteAssetUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.endsWith('/assets/img/placeholder.svg') || path.endsWith('\\assets\\img\\placeholder.svg')) {
    return null;
  }
  if (/\.svg($|\?)/i.test(path)) {
    return null;
  }
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizeProduct(product: ProductCardData): ProductCardData {
  return {
    ...product,
    imagePath: absoluteAssetUrl(product.imagePath),
    defaultVariation: product.defaultVariation ? {
      ...product.defaultVariation,
      images: product.defaultVariation.images.map((image) => ({
        ...image,
        path: absoluteAssetUrl(image.path) ?? image.path,
      })),
      material: product.defaultVariation.material
        ? normalizeMaterial(product.defaultVariation.material)
        : null,
    } : undefined,
    variations: product.variations?.map((variation) => ({
      ...variation,
      images: variation.images.map((image) => ({
        ...image,
        path: absoluteAssetUrl(image.path) ?? image.path,
      })),
      material: variation.material ? normalizeMaterial(variation.material) : null,
    })),
  };
}

function normalizeMaterial(material: Material): Material {
  return {
    ...material,
    imagePath: absoluteAssetUrl(material.imagePath),
  };
}

export async function fetchProducts(
  query: ProductsQuery = {},
): Promise<ProductCardData[]> {
  const params: Record<string, string | number | boolean> = {};
  if (query.featured !== undefined) params.featured = query.featured;
  if (query.materialSlug) params.material = query.materialSlug;
  if (query.currency) params.currency = query.currency;
  if (query.page) params.page = query.page;
  if (query.limit) params.limit = query.limit;

  const { data } = await api.get<ApiResponse<ProductCardData[]> | ProductCardData[]>(
    '/api/admin/products/public',
    { params },
  );
  return (unwrapData<ProductCardData[]>(data) ?? []).map(normalizeProduct);
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail> {
  const { data } = await api.get<ApiResponse<ProductDetail> | ProductDetail>(
    `/api/admin/products/public/${slug}`,
  );
  const product = unwrapData<ProductDetail>(data);
  if (!product) throw new Error('Product not found');

  return {
    ...product,
    imagePath: absoluteAssetUrl(product.imagePath),
    images: product.images.map((image) => ({
      ...image,
      path: absoluteAssetUrl(image.path) ?? image.path,
    })),
    material: product.material ? normalizeMaterial(product.material) : null,
    defaultVariation: product.defaultVariation ? {
      ...product.defaultVariation,
      images: product.defaultVariation.images.map((image) => ({
        ...image,
        path: absoluteAssetUrl(image.path) ?? image.path,
      })),
      material: product.defaultVariation.material
        ? normalizeMaterial(product.defaultVariation.material)
        : null,
    } : undefined,
    variations: product.variations?.map((variation) => ({
      ...variation,
      images: variation.images.map((image) => ({
        ...image,
        path: absoluteAssetUrl(image.path) ?? image.path,
      })),
      material: variation.material ? normalizeMaterial(variation.material) : null,
    })),
    recommendedProducts: product.recommendedProducts?.map(normalizeProduct),
  };
}

export async function fetchMaterials(): Promise<Material[]> {
  const { data } = await api.get<ApiResponse<Material[]> | Material[]>('/api/admin/materials/public');
  return (unwrapData<Material[]>(data) ?? []).map(normalizeMaterial);
}

export async function trackProductView(productId: number): Promise<void> {
  try {
    await api.post('/api/recommendations/viewed', { productId });
  } catch {
    // Product view tracking must never block browsing.
  }
}
