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
    <div className="profile-card panel glass">
      <div className="profile-header">
        <div className="profile-identity">
          <div className="profile-avatar">
            {name ? name.charAt(0).toUpperCase() : user?.Username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="profile-info-text">
            <h2 className="profile-name" title={name || 'Account Details'}>
              {name || 'Account Details'}
            </h2>
            <span className="badge badge-primary profile-badge">Customer</span>
          </div>
        </div>

        <div className="profile-completion">
          <span className="profile-percent">{profilePercent}%</span>
          <div className="profile-progress-track">
            <div className="profile-progress-bar" style={{ width: `${profilePercent}%` }} />
          </div>
        </div>
      </div>

      <div className="profile-details-list">
        {profileFields.map((field) => (
          <div key={field.label} className="profile-detail-item">
            <span className="profile-detail-label">{field.label}</span>
            <span className={`profile-detail-value ${(!field.value || field.value === 'Not provided') ? 'not-provided' : ''}`}>
              {field.value || 'Not provided'}
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .profile-card {
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          border-radius: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
          transition: all var(--transition-normal);
        }
        .profile-card:hover {
          border-color: rgba(37, 99, 235, 0.2);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }
        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }
        .profile-identity {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
          flex: 1;
        }
        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
          flex-shrink: 0;
        }
        .profile-info-text {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
          flex: 1;
        }
        .profile-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .profile-badge {
          align-self: start;
          font-size: 0.6rem;
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);
          border: 1px solid rgba(37, 99, 235, 0.15);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .profile-completion {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
          flex-shrink: 0;
        }
        .profile-percent {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--primary-color);
          line-height: 1;
        }
        .profile-progress-track {
          width: 48px;
          height: 3.5px;
          background: var(--bg-tertiary);
          border-radius: 999px;
          overflow: hidden;
        }
        .profile-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
          border-radius: 999px;
          transition: width 0.6s ease;
        }
        .profile-details-list {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          background: rgba(150, 150, 150, 0.01);
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(150, 150, 150, 0.05);
        }
        .profile-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          padding: 0.35rem 0;
          border-bottom: 1px solid rgba(150, 150, 150, 0.05);
        }
        .profile-detail-item:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }
        .profile-detail-label {
          width: 66px;
          flex-shrink: 0;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-primary);
          opacity: 0.95;
          padding-top: 0.1rem;
        }
        .profile-detail-value {
          flex: 1;
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-align: left;
          overflow-wrap: break-word;
          word-break: break-word;
          line-height: 1.35;
        }
        .profile-detail-value.not-provided {
          color: var(--text-muted);
          font-style: italic;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
