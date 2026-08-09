const KNOWN_ORDER_STATUSES: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  dispatched: 'Dispatched',
  'out for delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const formatOrderStatus = (status: unknown): string => {
  const normalized = String(status || '').trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!normalized) return 'Unknown';
  return KNOWN_ORDER_STATUSES[normalized.toLowerCase()]
    || normalized.replace(/\b\w/g, (character) => character.toUpperCase());
};

export const cancellationRestrictionMessage = (status: unknown): string => {
  const formattedStatus = formatOrderStatus(status);
  return formattedStatus === 'Delivered'
    ? 'This order has been Delivered and can no longer be cancelled.'
    : `This order is ${formattedStatus} and can no longer be cancelled.`;
};
