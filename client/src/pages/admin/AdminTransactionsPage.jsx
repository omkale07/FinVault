import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { ArrowLeftRight } from 'lucide-react';
import { getAmountColor, getAmountSign } from '../../lib/utils';

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getTransactions({ page, limit });
      setTransactions(response.data.transactions || []);
      setTotalPages(Math.ceil((response.data.count || 0) / limit));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Manage Transactions</h1>
      
      <Card>
        {loading && transactions.length === 0 ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTransactions} />
        ) : transactions.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No transactions found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">TX ID</th>
                  <th className="px-4 py-3">Wallet ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/25">
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{tx.id}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{tx.wallet_id || tx.walletId}</td>
                    <td className="px-4 py-3 capitalize">{tx.type}</td>
                    <td className={`px-4 py-3 font-semibold text-right ${getAmountColor(tx.type)}`}>
                      {getAmountSign(tx.type)}{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{tx.currency}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-right">{format(new Date(tx.created_at || tx.createdAt), 'PP p')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && !error && transactions.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminTransactionsPage;
