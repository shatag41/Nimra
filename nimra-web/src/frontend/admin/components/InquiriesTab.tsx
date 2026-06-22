import React from 'react';
import { Inquiry } from '@/types/cms';
import CustomSelect from './CustomSelect';

interface InquiriesTabProps {
  filteredInquiries: Inquiry[];
  showFilters: boolean;
  inquirySort: string;
  setInquirySort: (val: string) => void;
  inquiryStartDate: string;
  setInquiryStartDate: (val: string) => void;
  inquiryEndDate: string;
  setInquiryEndDate: (val: string) => void;
  handleInquiryReview: (inquiry: Inquiry) => Promise<boolean>;
  saveLoading: boolean;
}

export default function InquiriesTab({
  filteredInquiries,
  showFilters,
  inquirySort,
  setInquirySort,
  inquiryStartDate,
  setInquiryStartDate,
  inquiryEndDate,
  setInquiryEndDate,
  handleInquiryReview,
  saveLoading,
}: InquiriesTabProps) {
  return (
    <div className="inquiries-tab card glass">
      {showFilters && (
        <div className="filter-bar animate-fade-in">
          <div className="filter-group">
            <label>Date Sort:</label>
            <CustomSelect
              value={inquirySort}
              onChange={setInquirySort}
              clearable={true}
              onClear={() => setInquirySort('latest')}
              options={[
                { value: 'latest', label: 'Latest First' },
                { value: 'earliest', label: 'Earliest First' },
              ]}
            />
          </div>
          <div className="filter-group">
            <label>From:</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                value={inquiryStartDate}
                onChange={(e) => setInquiryStartDate(e.target.value)}
                className="form-input filter-input"
              />
            </div>
          </div>
          <div className="filter-group">
            <label>To:</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                value={inquiryEndDate}
                min={inquiryStartDate}
                onChange={(e) => setInquiryEndDate(e.target.value)}
                className="form-input filter-input"
              />
            </div>
          </div>
        </div>
      )}
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Customer</th>
              <th>Inquiry Details</th>
              <th className="sticky-action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.map((inq, index) => {
              const inquiryId = inq['Inquiry ID'] || inq.InquiryID || inq.ID;
              const customerId = inq['Customer ID'] || inq.CustomerID || 'Guest';
              const isNew = !inq.Status || inq.Status === 'New';
              return (
              <tr key={String(inquiryId || index)}>
                <td>{new Date(inq.Timestamp).toLocaleString()}</td>
                <td>
                  <div><strong>{inq.Name}</strong></div>
                  <small>{inq.Phone}</small>
                  {inq.Email && <div><small>{inq.Email}</small></div>}
                  <div><small>Customer ID: {customerId}</small></div>
                </td>
                <td>
                  <div><small>Inquiry ID: {inquiryId || 'Legacy record'}</small></div>
                  <div style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{inq.Subject}</div>
                  <p className="message-cell">{inq.Message}</p>
                  <span className={`status-badge ${isNew ? 'status-pending' : 'status-delivered'}`}>
                    {isNew ? 'New' : 'Reviewed'}
                  </span>
                </td>
                <td className="sticky-action-col">
                  <div className="actions-flex vertical">
                    <a href={`tel:${inq.Phone}`} className="btn-table btn-edit text-center">
                      📞 Call
                    </a>
                    <a
                      href={`https://wa.me/${String(inq.Phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${inq.Name}, thank you for reaching out to NIMRA regarding "${inq.Subject}".`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-table btn-whatsapp"
                    >
                      💬 WhatsApp
                    </a>
                    {isNew && (
                      <button
                        type="button"
                        className="btn-table btn-view"
                        disabled={saveLoading || !inquiryId}
                        onClick={() => void handleInquiryReview(inq)}
                      >
                        Mark reviewed
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
            {filteredInquiries.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-td">No inquiries found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
