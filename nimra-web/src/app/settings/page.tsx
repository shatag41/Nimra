import type { Metadata } from 'next';
import SettingsClient from '@/frontend/customer/components/SettingsClient';

export const metadata: Metadata = {
  title: 'Account Settings | NIMRA',
  description: 'Manage your NIMRA password, email preferences, and account.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
