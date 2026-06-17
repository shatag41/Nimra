import React from 'react';
import { CurrentUser } from '../hooks/useAdminData';

interface ProfilePanelProps {
  currentUser: CurrentUser | null;
  isProfilePanelOpen: boolean;
  setIsProfilePanelOpen: (open: boolean) => void;
  profileForm: { name: string; email: string; phone: string };
  setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string }>>;
  profileFeedback: { type: 'success' | 'error'; text: string } | null;
  setProfileFeedback: (feedback: { type: 'success' | 'error'; text: string } | null) => void;
  profileValidationErrors: { [key: string]: string };
  setProfileValidationErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  isProfileSaving: boolean;
  handleProfileSave: () => Promise<void>;
}

export default function ProfilePanel({
  currentUser,
  isProfilePanelOpen,
  setIsProfilePanelOpen,
  profileForm,
  setProfileForm,
  profileFeedback,
  setProfileFeedback,
  profileValidationErrors,
  setProfileValidationErrors,
  isProfileSaving,
  handleProfileSave,
}: ProfilePanelProps) {
  if (!isProfilePanelOpen) return null;

  return (
    <div className="profile-panel-overlay" onClick={() => setIsProfilePanelOpen(false)}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
        <div className="profile-panel-header">
          <div>
            <h2>Edit Profile</h2>
            <p>Update your profile information</p>
          </div>
          <button 
            onClick={() => setIsProfilePanelOpen(false)}
            className="close-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="profile-panel-content">
          <div className="profile-avatar-section">
            <div className="profile-panel-avatar">
              {currentUser?.name?.[0] || 'A'}
            </div>
          </div>
          
          <form className="profile-form" onSubmit={(e) => { e.preventDefault(); void handleProfileSave(); }}>
            <div className="form-group">
              <label htmlFor="profile-name">Full Name</label>
              <input 
                id="profile-name"
                type="text" 
                value={profileForm.name}
                onChange={(e) => {
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }));
                  if (profileValidationErrors.name) {
                    setProfileValidationErrors((prev) => ({ ...prev, name: '' }));
                  }
                }}
                className={`form-input ${profileValidationErrors.name ? 'form-input-error' : ''}`}
              />
              {profileValidationErrors.name && (
                <div className="form-input-error-message">
                  {profileValidationErrors.name}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-email">Email Address</label>
              <input 
                id="profile-email"
                type="email" 
                value={profileForm.email}
                onChange={(e) => {
                  setProfileForm((prev) => ({ ...prev, email: e.target.value }));
                  if (profileValidationErrors.email) {
                    setProfileValidationErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                className={`form-input ${profileValidationErrors.email ? 'form-input-error' : ''}`}
                placeholder="your@email.com"
              />
              {profileValidationErrors.email && (
                <div className="form-input-error-message">
                  {profileValidationErrors.email}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="profile-phone">Phone Number</label>
              <input 
                id="profile-phone"
                type="tel" 
                value={profileForm.phone}
                onChange={(e) => {
                  setProfileForm((prev) => ({ ...prev, phone: e.target.value }));
                  if (profileValidationErrors.phone) {
                    setProfileValidationErrors((prev) => ({ ...prev, phone: '' }));
                  }
                }}
                className={`form-input ${profileValidationErrors.phone ? 'form-input-error' : ''}`}
                placeholder="+91 99999 99999"
              />
              {profileValidationErrors.phone && (
                <div className="form-input-error-message">
                  {profileValidationErrors.phone}
                </div>
              )}
            </div>

            {profileFeedback && (
              <div className={`profile-feedback ${profileFeedback.type}`}>
                {profileFeedback.text}
              </div>
            )}
            
            <div className="profile-actions">
              <button 
                onClick={() => {
                  setProfileFeedback(null);
                  setIsProfilePanelOpen(false);
                }}
                className="btn btn-secondary"
                type="button"
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                type="submit"
                disabled={isProfileSaving}
              >
                {isProfileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
