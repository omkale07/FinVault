import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { Users } from 'lucide-react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getUsers({ page, limit });
      setUsers(response.data.users || []);
      setTotalPages(Math.ceil((response.data.count || 0) / limit));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Manage Users</h1>
      
      <Card>
        {loading && users.length === 0 ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3 rounded-tr-lg">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/25">
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{user.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.is_verified || user.isVerified ? 'Active' : 'Pending'} />
                    </td>
                    <td className="px-4 py-3">{format(new Date(user.created_at || user.createdAt), 'PP')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && !error && users.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminUsersPage;
