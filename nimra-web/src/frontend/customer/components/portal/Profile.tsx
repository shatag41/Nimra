'use client';

import React, { useState, useEffect } from 'react';
import type { User } from '@/frontend/customer/contexts/AuthContext';

interface ProfileProps {
  user: User | null;
}

interface SavedAddress {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  fullAddress: string;
  city: string;
  pincode: string;
}

export function Profile({ user }: ProfileProps) {
  const [addressDisplay, setAddressDisplay] = useState('Not provided');
  const mobile = user?.Mobile || '';
  const name = user?.Name || '';

  useEffect(() => {
    const storageKey = `nimra_saved_addresses_${user?.ID || 'guest'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: SavedAddress[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          const first = parsed[0];
          setAddressDisplay(`${first.fullAddress}, ${first.city} - ${first.pincode} (${first.type})`);
        } else {
          setAddressDisplay('Not provided');
        }
      } catch (e) {
        console.error('Failed to parse saved addresses in profile card', e);
        setAddressDisplay('Not provided');
      }
    } else {
      setAddressDisplay('Not provided');
    }
  }, [user]);

  const profileFields = [
    { label: 'Name', value: name || user?.Name },
    { label: 'Email', value: user?.Username },
    { label: 'Mobile', value: mobile || user?.Mobile },
    { label: 'Address', value: addressDisplay },
  ];
  
  const completedProfileFields = profileFields.filter((field) => Boolean(field.value) && field.value !== 'Not provided').length;
  const profilePercent = Math.round((completedProfileFields / profileFields.length) * 100);

  return (
    <div className="panel profile-card">
      <div className="panel-head compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Profile</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2>Account Details</h2>
          </div>
        </div>
        <span className="completion">{profilePercent}%</span>
      </div>
      <div className="progress-track"><span style={{ width: `${profilePercent}%` }} /></div>
      <dl className="profile-list">
        {profileFields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
