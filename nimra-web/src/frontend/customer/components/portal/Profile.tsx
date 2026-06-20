'use client';

import React, { useState, useEffect } from 'react';
import type { User } from '@/frontend/customer/contexts/AuthContext';
import { getUserSavedAddresses } from '@/frontend/customer/utils/userAddresses';

interface ProfileProps {
  user: User | null;
}

export function Profile({ user }: ProfileProps) {
  const [addressDisplay, setAddressDisplay] = useState('Not provided');
  const mobile = user?.Mobile || '';
  const name = user?.Name || '';

  useEffect(() => {
    const parsed = getUserSavedAddresses(user as any);
    if (parsed.length > 0) {
      const first = parsed.find((address) => address.isDefault) || parsed[0];
      setAddressDisplay(`${first.fullAddress || first.locality}, ${first.city} - ${first.pincode} (${first.type})`);
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
    <div className="card profile-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '800' }}>
            {name ? name.charAt(0).toUpperCase() : user?.Username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.1rem' }}>{name || 'Account Details'}</h2>
            <span className="badge badge-primary">Customer</span>
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-color)' }}>{profilePercent}% Complete</span>
      </div>
      
      <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${profilePercent}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '999px', transition: 'width 0.5s ease-out' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
        {profileFields.map((field) => (
          <div key={field.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{field.label}</span>
            <span style={{ fontSize: '0.95rem', color: field.value && field.value !== 'Not provided' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: '500' }}>
              {field.value || 'Not provided'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
