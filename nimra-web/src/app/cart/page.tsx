import dynamic from 'next/dynamic';
import LoadingState from '@/frontend/customer/components/LoadingState';

const CartClient = dynamic(() => import('@/frontend/customer/components/CartClient'), {
  loading: () => <LoadingState label="Loading cart" />
});

export const metadata = {
  title: 'Cart',
};

export default function CartPage() {
  return <CartClient />;
}
