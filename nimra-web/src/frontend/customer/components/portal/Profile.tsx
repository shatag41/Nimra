'use client';

import React from 'react';
import type { User } from '@/frontend/customer/contexts/AuthContext';

interface ProfileProps {
  user: User | null;
}

export function Profile({ user }: ProfileProps) {
  const profileFields = [
    { label: 'Email', value: user?.Username },
    { label: 'Mobile', value: user?.Mobile },
    { label: 'Role', value: user?.Role },
  ];
  const completedProfileFields = profileFields.filter((field) => Boolean(field.value)).length;
  const profilePercent = Math.round((completedProfileFields / profileFields.length) * 100);

  return (
    <div className="panel profile-card">
      <div className="panel-head compact">
        <div>
          <span className="eyebrow" style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.7rem' }}>Profile</span>
          <h2>Account Details</h2>
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
