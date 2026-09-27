import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { Wallet } from 'lucide-react';

const AdminWalletsPage = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchWallets();
  }, [page]);

  const fetchWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getWallets({ page, limit });
      setWallets(response.data.wallets || []);
      setTotalPages(Math.ceil((response.data.count || 0) / limit));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Manage Wallets</h1>
      
      <Card>
        {loading && wallets.length === 0 ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchWallets} />
        ) : wallets.length === 0 ? (
          <EmptyState icon={Wallet} title="No wallets found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Wallet ID</th>
                  <th className="px-4 py-3">Owner ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-lg">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-slate-800/25">
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{wallet.id}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{wallet.user_id || wallet.userId}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{wallet.name}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">{wallet.currency}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={wallet.status} />
                    </td>
                    <td className="px-4 py-3">{format(new Date(wallet.created_at || wallet.createdAt), 'PP')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && !error && wallets.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminWalletsPage;
