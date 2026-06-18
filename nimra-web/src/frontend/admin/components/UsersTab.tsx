import React from 'react';
import { AdminUser } from '@/types/cms';
import { CurrentUser } from '../hooks/useAdminData';
import CustomSelect from './CustomSelect';

interface UsersTabProps {
  currentUser: CurrentUser;
  filteredUsers: AdminUser[];
  showFilters: boolean;
  userRoleFilter: string;
  setUserRoleFilter: (val: string) => void;
  userStatusFilter: string;
  setUserStatusFilter: (val: string) => void;
  setEditingUser: (u: Partial<AdminUser> | null) => void;
  setUserFormOpen: (open: boolean) => void;
  handleUserDelete: (id: string | number) => Promise<boolean>;
}

export default React.memo(function UsersTab({
  currentUser,
  filteredUsers,
  showFilters,
  userRoleFilter,
  setUserRoleFilter,
  userStatusFilter,
  setUserStatusFilter,
  setEditingUser,
  setUserFormOpen,
  handleUserDelete,
}: UsersTabProps) {
  if (currentUser.role !== 'Admin') {
    return (
      <div className="users-tab card glass">
        <div className="access-denied-block">
          <h2>🚫 Administrative Privileges Required</h2>
          <p>Only full administrators can view, register, or delete system user accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-tab card glass">
      <div className="section-head-btn">
        <h3>Portal User Accounts</h3>
        <button 
          className="btn btn-primary btn-add" 
          onClick={() => {
            setEditingUser({ Username: '', Password: '', Role: 'Customer', Name: '', Active: true });
            setUserFormOpen(true);
          }}
        >
          ➕ Create User
        </button>
      </div>

      {showFilters && (
        <div className="filter-bar animate-fade-in">
          <div className="filter-group">
            <label>Role:</label>
            <CustomSelect
              value={userRoleFilter}
              onChange={setUserRoleFilter}
              clearable={true}
              onClear={() => setUserRoleFilter('All')}
              options={[
                { value: 'All', label: 'All Roles' },
                { value: 'Admin', label: 'Admin' },
                { value: 'Customer', label: 'Customer' },
              ]}
            />
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <CustomSelect
              value={userStatusFilter}
              onChange={setUserStatusFilter}
              clearable={true}
              onClear={() => setUserStatusFilter('All')}
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
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th className="sticky-action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.ID}>
                <td>{u.ID}</td>
                <td><strong>{u.Name}</strong></td>
                <td><code>{u.Username}</code></td>
                <td>
                  <span className={`badge ${u.Role === 'Admin' ? 'badge-primary' : 'badge-secondary'}`}>
                    {u.Role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.Active !== false ? 'badge-primary' : 'badge-cancelled'}`}>
                    {u.Active !== false ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="sticky-action-col">
                  <div className="actions-flex">
                    <button 
                      className="btn-table btn-edit" 
                      onClick={() => {
                        setEditingUser(u);
                        setUserFormOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-table btn-delete" 
                      onClick={() => void handleUserDelete(u.ID)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-td">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
