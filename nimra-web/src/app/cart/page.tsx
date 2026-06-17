import dynamic from 'next/dynamic';

const CartClient = dynamic(() => import('@/frontend/customer/components/CartClient'), {
  loading: () => <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Cart...</div>
});

export const metadata = {
  title: 'Cart',
};

export default function CartPage() {
  return <CartClient />;
}
