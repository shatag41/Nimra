import dynamic from 'next/dynamic';
import LoadingState from '@/frontend/customer/components/LoadingState';

const CheckoutClient = dynamic(() => import('@/frontend/customer/components/CheckoutClient'), {
  loading: () => <LoadingState label="Loading checkout" />
});

export const metadata = {
  title: 'Checkout',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
