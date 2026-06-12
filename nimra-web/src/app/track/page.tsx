import { Suspense } from 'react';
import TrackClient from './TrackClient';

export const metadata = {
  title: 'Track Order',
};

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>Loading tracker...</div>}>
      <TrackClient />
    </Suspense>
  );
}
