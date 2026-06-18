import React from 'react';
import { FAQ } from '@/types/cms';
import CustomSelect from './CustomSelect';

interface FAQsTabProps {
  filteredFaqs: FAQ[];
  showFilters: boolean;
  faqStatusFilter: string;
  setFaqStatusFilter: (val: string) => void;
  setEditingFAQ: (f: Partial<FAQ> | null) => void;
  setFAQFormOpen: (open: boolean) => void;
  handleFAQDelete: (id: string | number) => Promise<boolean>;
}

export default function FAQsTab({
  filteredFaqs,
  showFilters,
  faqStatusFilter,
  setFaqStatusFilter,
  setEditingFAQ,
  setFAQFormOpen,
  handleFAQDelete,
}: FAQsTabProps) {
  return (
    <div className="faqs-tab card glass">
      <div className="section-head-btn">
        <h3>Frequently Asked Questions</h3>
        <button 
          className="btn btn-primary btn-add" 
          onClick={() => {
            setEditingFAQ({ Question: '', Answer: '', Active: true });
            setFAQFormOpen(true);
          }}
        >
          ➕ Add FAQ
        </button>
      </div>

      {showFilters && (
        <div className="filter-bar animate-fade-in">
          <div className="filter-group">
            <label>Status:</label>
            <CustomSelect
              value={faqStatusFilter}
              onChange={setFaqStatusFilter}
              clearable={true}
              onClear={() => setFaqStatusFilter('All')}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Question</th>
              <th>Answer</th>
              <th>Status</th>
              <th className="sticky-action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaqs.map((f) => (
              <tr key={f.ID}>
                <td>{f.ID}</td>
                <td><strong>{f.Question}</strong></td>
                <td className="max-cell-width">{f.Answer}</td>
                <td>
                  <span className={`badge ${f.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>
                    {f.Active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="sticky-action-col">
                  <div className="actions-flex">
                    <button 
                      className="btn-table btn-edit" 
                      onClick={() => {
                        setEditingFAQ(f);
                        setFAQFormOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-table btn-delete" 
                      onClick={() => void handleFAQDelete(f.ID)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredFaqs.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-td">No FAQs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
