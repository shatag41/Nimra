import type { AdminUser, CancellationRequest, OrderRecord } from '@/types/cms';

export type CustomerDeletionEligibility = {
  eligible: boolean;
  orderId?: string;
  status?: string;
  message?: string;
};

const terminalOrderStatuses = new Set(['delivered', 'cancelled']);
const terminalWorkflowStatuses = new Set([
  '', 'none', 'not applicable', 'not required', 'no online refund required',
  'paid', 'completed', 'complete', 'settled', 'refunded', 'processed', 'approved', 'rejected',
]);

const normalize = (value: unknown) => String(value ?? '').trim();
const digits = (value: unknown) => normalize(value).replace(/\D/g, '');
const email = (value: unknown) => normalize(value).toLowerCase();

export function orderBelongsToCustomer(order: OrderRecord, customer: Pick<AdminUser, 'ID' | 'Username' | 'Mobile'>) {
  const orderUserId = normalize(order.userId || order.customer?.userId);
  if (orderUserId) return orderUserId === normalize(customer.ID);
  const customerEmail = email(customer.Username);
  const customerMobile = digits(customer.Mobile);
  return Boolean(
    (customerEmail && email(order.customer?.email) === customerEmail) ||
    (customerMobile && digits(order.customer?.mobile) === customerMobile)
  );
}

export function getCustomerDeletionEligibility(
  customer: Pick<AdminUser, 'ID' | 'Username' | 'Mobile'>,
  orders: OrderRecord[],
  cancellationRequests: CancellationRequest[] = []
): CustomerDeletionEligibility {
  const linkedOrders = orders.filter((order) => orderBelongsToCustomer(order, customer));

  for (const order of linkedOrders) {
    const orderId = normalize(order.orderId) || 'Unknown order';
    const orderStatus = normalize(order.status) || 'Unknown';
    if (!terminalOrderStatuses.has(orderStatus.toLowerCase())) {
      return blocked(orderId, orderStatus);
    }

    const cancellationStatus = normalize(order.cancellationStatus);
    if (['pending', 'requested', 'processing'].includes(cancellationStatus.toLowerCase())) {
      return blocked(orderId, `Cancellation ${cancellationStatus}`);
    }

    const relatedRequests = cancellationRequests.filter((request) => normalize(request.orderId) === orderId);
    for (const request of relatedRequests) {
      const requestStatus = normalize(request.status);
      if (['pending', 'requested', 'processing'].includes(requestStatus.toLowerCase())) {
        return blocked(orderId, `Cancellation ${requestStatus}`);
      }
      const refundStatus = normalize(request.refundStatus);
      if (!terminalWorkflowStatuses.has(refundStatus.toLowerCase())) {
        return blocked(orderId, `Refund ${refundStatus}`);
      }
    }

    const record = order as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (!/(payment|refund|pending.*action|action.*status)/i.test(key) || key === 'paymentMethod') continue;
      const workflowStatus = normalize(value);
      if (workflowStatus && !terminalWorkflowStatuses.has(workflowStatus.toLowerCase())) {
        const label = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
        return blocked(orderId, `${label}: ${workflowStatus}`);
      }
    }
  }

  return { eligible: true };
}

function blocked(orderId: string, status: string): CustomerDeletionEligibility {
  return {
    eligible: false,
    orderId,
    status,
    message: `Order ${orderId} is blocking deletion (${status}).`,
  };
}
