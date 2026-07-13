import type { Metadata } from 'next';
import ProfileSettingsClient from '@/frontend/customer/components/ProfileSettingsClient';

export const metadata: Metadata = {
  title: 'Profile Settings | NIMRA',
  description: 'Update your NIMRA profile and contact details.',
};

export default function ProfileSettingsPage() {
  return <ProfileSettingsClient />;
}
