import dynamic from 'next/dynamic';

const TrackClient = dynamic(() => import('@/frontend/customer/components/TrackClient'), {
  loading: () => <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>Loading tracker...</div>
});

export const metadata = {
  title: 'Track Order',
};

export default function TrackPage() {
  return (
    <TrackClient />
  );
}
