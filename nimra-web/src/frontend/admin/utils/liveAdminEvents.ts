import type { CancellationRequest, Inquiry, Notification, OrderRecord } from '@/types/cms';

const text = (value: unknown) => String(value ?? '').trim();

const completedEventTypes = new Set([
  'ORDER_STATUS_CHANGED',
  'INQUIRY_REVIEWED',
  'CANCELLATION_APPROVED',
  'CANCELLATION_REJECTED',
]);

export function getActionableAdminUpdates(
  notifications: Notification[],
  orders: OrderRecord[],
  inquiries: Inquiry[],
  cancellationRequests: CancellationRequest[] = [],
) {
  return notifications.filter((event) => {
    const eventType = text(event.EventType).toUpperCase();
    if (completedEventTypes.has(eventType)) return false;

    if (eventType === 'ORDER_CREATED') {
      const orderId = text(event.OrderID || event.RelatedEntityID);
      const order = orders.find(item => text(item.orderId) === orderId);
      return !order || order.status === 'Pending';
    }

    if (eventType === 'INQUIRY_CREATED') {
      const inquiryId = text(event.InquiryID || event.RelatedEntityID);
      const inquiry = inquiries.find(item =>
        text(item.InquiryID || item['Inquiry ID'] || item.ID) === inquiryId
      );
      return !inquiry || text(inquiry.Status).toLowerCase() !== 'reviewed';
    }

    if (eventType === 'CANCELLATION_REQUESTED') {
      const requestId = text(event.RelatedEntityID);
      const request = cancellationRequests.find(item => text(item.requestId) === requestId);
      if (request) return request.status === 'Pending';

      const orderId = text(event.OrderID);
      const order = orders.find(item => text(item.orderId) === orderId);
      return !order || order.cancellationStatus === 'Pending';
    }

    return true;
  });
}
