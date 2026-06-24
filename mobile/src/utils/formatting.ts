export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatOrderStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending Confirmation',
    confirmed: 'Order Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}

export function formatEnquiryStatus(status: string): string {
  const labels: Record<string, string> = {
    new: 'New',
    read: 'Under Review',
    replied: 'Replied',
    closed: 'Closed',
  };
  return labels[status] ?? status;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
