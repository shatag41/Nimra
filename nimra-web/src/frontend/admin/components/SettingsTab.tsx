import React from 'react';
import { CompanyInfo } from '@/types/cms';
import { CurrentUser } from '../hooks/useAdminData';

interface SettingsTabProps {
  currentUser: CurrentUser;
  companyInfo: CompanyInfo;
  handleSettingsSubmit: (e: React.FormEvent) => Promise<boolean>;
  handleSettingsFieldChange: (key: string, value: string) => void;
  saveLoading: boolean;
}

export default function SettingsTab({
  currentUser,
  companyInfo,
  handleSettingsSubmit,
  handleSettingsFieldChange,
  saveLoading,
}: SettingsTabProps) {
  if (currentUser.role !== 'Admin') {
    return (
      <div className="settings-tab">
        <div className="access-denied-block">
          <h2>🚫 Administrative Privileges Required</h2>
          <p>Only full administrators can view, register, or edit core company settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-tab">
      <form onSubmit={handleSettingsSubmit} className="settings-form">
        <div className="settings-header-banner" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="settings-banner-icon" style={{ fontSize: '2rem' }}>⚙️</div>
          <div>
            <h3 style={{ margin: 0 }}>NIMRA Brand & Contact Configurator</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              These settings sync instantly across all checkout panels, headers, maps, and social integrations on both Customer Web and Customer Mobile applications.
            </p>
          </div>
        </div>

        {/* SECTION 1: Brand & Contact Info */}
        <div className="settings-section">
          <div className="settings-section-title">
            <span>🏷️</span> Brand Details & Social Channels
          </div>
          <div className="settings-grid">
            <div className="form-group">
              <label>Brand Name</label>
              <input
                required
                type="text"
                value={companyInfo.BrandName || ''}
                onChange={(e) => handleSettingsFieldChange('BrandName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Support Phone Number</label>
              <input
                required
                type="text"
                value={companyInfo.Phone || ''}
                onChange={(e) => handleSettingsFieldChange('Phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contact Email Address</label>
              <input
                required
                type="email"
                value={companyInfo.Email || ''}
                onChange={(e) => handleSettingsFieldChange('Email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>WhatsApp Registry Number (Country Code Prepended)</label>
              <input
                required
                type="text"
                value={companyInfo.WhatsAppNumber || ''}
                onChange={(e) => handleSettingsFieldChange('WhatsAppNumber', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Operations & Plant Locations */}
        <div className="settings-section">
          <div className="settings-section-title">
            <span>📍</span> Operations & Plant Locations
          </div>
          <div className="form-group">
            <label>Office Address Location Description</label>
            <input
              required
              type="text"
              value={companyInfo.OfficeAddress || ''}
              onChange={(e) => handleSettingsFieldChange('OfficeAddress', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label>Packaging Plant Address Location Description</label>
            <input
              required
              type="text"
              value={companyInfo.PlantAddress || ''}
              onChange={(e) => handleSettingsFieldChange('PlantAddress', e.target.value)}
            />
          </div>
        </div>

        {/* SECTION 3: Brand Narrative & Identity */}
        <div className="settings-section">
          <div className="settings-section-title">
            <span>📖</span> Brand Story & Quality Standards
          </div>
          <div className="form-group">
            <label>About Us Brand Story Narrative</label>
            <textarea
              rows={4}
              value={companyInfo.AboutStory || ''}
              onChange={(e) => handleSettingsFieldChange('AboutStory', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label>Quality Standards Narrative Text</label>
            <textarea
              rows={3}
              value={companyInfo.QualityText || ''}
              onChange={(e) => handleSettingsFieldChange('QualityText', e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }} disabled={saveLoading}>
          {saveLoading ? 'Saving Info...' : '💾 Overwrite Company Info'}
        </button>
      </form>
    </div>
  );
}
