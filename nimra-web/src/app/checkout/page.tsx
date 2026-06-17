import dynamic from 'next/dynamic';

const CheckoutClient = dynamic(() => import('@/frontend/customer/components/CheckoutClient'), {
  loading: () => <div className="loading-state" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading Checkout...</div>
});

export const metadata = {
  title: 'Checkout',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
