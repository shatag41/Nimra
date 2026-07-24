import React, { useState } from 'react';
import { AdminUser, CancellationRequest, OrderRecord } from '@/types/cms';
import LogoutConfirmationModal from '@/frontend/customer/components/LogoutConfirmationModal';
import { CurrentUser } from '../hooks/useAdminData';
import CustomSelect from './CustomSelect';
import { getCustomerDeletionEligibility } from '@/utils/customerDeletion';

interface UsersTabProps {
  currentUser: CurrentUser;
  customers: AdminUser[];
  orders: OrderRecord[];
  cancellationRequests: CancellationRequest[];
  showFilters: boolean;
  customerStatusFilter: string;
  setCustomerStatusFilter: (value: string) => void;
  setEditingUser: (u: Partial<AdminUser> | null) => void;
  setUserFormOpen: (open: boolean) => void;
  handleUserDelete: (id: string | number) => Promise<boolean>;
}

export default React.memo(function UsersTab({
  currentUser,
  customers,
  orders,
  cancellationRequests,
  showFilters,
  customerStatusFilter,
  setCustomerStatusFilter,
  setEditingUser,
  setUserFormOpen,
  handleUserDelete,
}: UsersTabProps) {
  const [customerToDelete, setCustomerToDelete] = useState<AdminUser | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const confirmCustomerDelete = async () => {
    if (!customerToDelete) return;
    setDeletePending(true);
    const deleted = await handleUserDelete(customerToDelete.ID);
    setDeletePending(false);
    if (deleted) setCustomerToDelete(null);
  };

  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="users-tab card glass">
        <div className="access-denied-block">
          <h2>🚫 Administrative Privileges Required</h2>
          <p>Only full administrators can view, edit, or delete customer accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-tab card glass">
      <div className="section-head-btn">
        <h3>Customer Accounts</h3>
      </div>

      {showFilters && (
        <div className="filter-bar animate-fade-in">
          <div className="filter-group">
            <label>Status:</label>
            <CustomSelect
              value={customerStatusFilter}
              onChange={setCustomerStatusFilter}
              clearable={true}
              onClear={() => setCustomerStatusFilter('All')}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Disabled' },
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
              <th>Name</th>
              <th>Portal Login Mail</th>
              <th>Role</th>
              <th>Status</th>
              <th className="sticky-action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((u) => {
              const deletion = getCustomerDeletionEligibility(u, orders, cancellationRequests);
              return <tr key={u.ID}>
                <td>{u.ID}</td>
                <td><strong>{u.Name}</strong></td>
                <td><code>{u.Username}</code></td>
                <td>
                  <span className={`badge ${u.Role === 'Admin' ? 'badge-primary' : 'badge-secondary'}`}>
                    {u.Role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${String(u.Active ?? true).toLowerCase() !== 'false' ? 'badge-primary' : 'badge-cancelled'}`}>
                    {String(u.Active ?? true).toLowerCase() !== 'false' ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="sticky-action-col">
                  <div className="actions-flex">
                    <button 
                      className="btn-table btn-edit" 
                      onClick={() => {
                        setEditingUser({ ...u, Role: 'Customer' });
                        setUserFormOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-table btn-delete" 
                      onClick={() => setCustomerToDelete(u)}
                      disabled={!deletion.eligible}
                      title={deletion.eligible ? 'Delete customer' : deletion.message}
                    >
                      Delete
                    </button>
                    {!deletion.eligible && <span className="customer-delete-blocker">Order {deletion.orderId}: {deletion.status}</span>}
                  </div>
                </td>
              </tr>;
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-td">No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <LogoutConfirmationModal
        isOpen={Boolean(customerToDelete)}
        onClose={() => !deletePending && setCustomerToDelete(null)}
        onConfirm={confirmCustomerDelete}
        title="Delete customer account?"
        description={`This will permanently delete ${customerToDelete?.Name || 'this customer'} and cannot be undone.`}
        confirmText="Delete Customer"
        confirmButtonClass="btn btn-error"
        isProcessing={deletePending}
        stableFlowLayout
      />
    </div>
  );
});
