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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.map((inq, index) => (
              <tr key={index}>
                <td>{new Date(inq.Timestamp).toLocaleString()}</td>
                <td>
                  <div><strong>{inq.Name}</strong></div>
                  <small>{inq.Phone}</small>
                  {inq.Email && <div><small>{inq.Email}</small></div>}
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{inq.Subject}</div>
                  <p className="message-cell">{inq.Message}</p>
                </td>
                <td>
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
                  </div>
                </td>
              </tr>
            ))}
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
