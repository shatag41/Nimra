import React from 'react';
import { FAQ } from '@/types/cms';
import CustomSelect from './CustomSelect';

interface FAQModalProps {
  editingFAQ: Partial<FAQ>;
  setEditingFAQ: React.Dispatch<React.SetStateAction<Partial<FAQ> | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saveLoading: boolean;
}

export default function FAQModal({
  editingFAQ,
  setEditingFAQ,
  onClose,
  onSubmit,
  saveLoading,
}: FAQModalProps) {
  return (
    <div className="modal-backdrop glass">
      <div className="modal-card animate-fade-in">
        <div className="modal-header">
          <h2>{editingFAQ.ID ? 'Edit FAQ ID #' + editingFAQ.ID : 'Add Store FAQ'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-group">
            <label>Question Topic</label>
            <input
              required
              type="text"
              value={editingFAQ.Question || ''}
              onChange={(e) => setEditingFAQ(prev => prev ? ({ ...prev, Question: e.target.value }) : null)}
              placeholder="e.g. What makes NIMRA water pure?"
            />
          </div>

          <div className="form-group">
            <label>Answer Explanation</label>
            <textarea
              required
              rows={4}
              value={editingFAQ.Answer || ''}
              onChange={(e) => setEditingFAQ(prev => prev ? ({ ...prev, Answer: e.target.value }) : null)}
              placeholder="Explain details..."
            />
          </div>

          <div className="form-group form-row-relative">
            <label>FAQ Registry Status</label>
            <CustomSelect
              value={editingFAQ.Active !== false ? 'true' : 'false'}
              onChange={(val) => setEditingFAQ(prev => prev ? ({ ...prev, Active: val === 'true' }) : null)}
              options={[
                { value: 'true', label: 'Active & Published' },
                { value: 'false', label: 'Draft / Inactive' },
              ]}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              Save FAQ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
