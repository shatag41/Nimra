import React from 'react';
import { AdminUser } from '@/types/cms';
import CustomSelect from './CustomSelect';

interface UserModalProps {
  editingUser: Partial<AdminUser>;
  setEditingUser: React.Dispatch<React.SetStateAction<Partial<AdminUser> | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saveLoading: boolean;
}

export default function UserModal({
  editingUser,
  setEditingUser,
  onClose,
  onSubmit,
  saveLoading,
}: UserModalProps) {
  return (
    <div className="modal-backdrop glass">
      <div className="modal-card animate-fade-in">
        <div className="modal-header">
          <h2>{editingUser.ID ? 'Edit Account ID #' + editingUser.ID : 'Create System Account'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-group">
            <label>Full Display Name</label>
            <input
              required
              type="text"
              value={editingUser.Name || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 26) {
                  setEditingUser(prev => prev ? ({ ...prev, Name: value }) : null);
                }
              }}
              maxLength={26}
              placeholder="e.g. John Doe"
            />
            {editingUser.Name && editingUser.Name.length === 26 && (
              <p className="form-group-error">
                Display Name cannot exceed 26 characters.
              </p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Portal Login Mail</label>
              <input
                required
                type="email"
                value={editingUser.Username || ''}
                onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, Username: e.target.value }) : null)}
                placeholder="e.g. customer@example.com"
              />
            </div>
            <div className="form-group">
              <label>Security Password</label>
              <input
                required
                type="password"
                value={editingUser.Password || ''}
                onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, Password: e.target.value }) : null)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="form-row form-row-relative">
            <div className="form-group">
              <label>Access Role Authority</label>
              <input
                type="text"
                value="Customer (Portal Access)"
                disabled
                aria-label="Access Role Authority"
              />
            </div>
            <div className="form-group">
              <label>Account Status</label>
              <CustomSelect
                value={String(editingUser.Active ?? true).toLowerCase() !== 'false' ? 'true' : 'false'}
                onChange={(val) => setEditingUser(prev => prev ? ({ ...prev, Active: val === 'true' }) : null)}
                options={[
                  { value: 'true', label: 'Enabled (Access Allowed)' },
                  { value: 'false', label: 'Disabled (Suspended)' },
                ]}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              Save User Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
