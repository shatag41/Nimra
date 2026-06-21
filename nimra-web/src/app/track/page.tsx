import dynamic from 'next/dynamic';
import LoadingState from '@/frontend/customer/components/LoadingState';

const TrackClient = dynamic(() => import('@/frontend/customer/components/TrackClient'), {
  loading: () => <LoadingState label="Loading tracker" />
});

export const metadata = {
  title: 'Track Order',
};

export default function TrackPage() {
  return (
    <TrackClient />
  );
}
