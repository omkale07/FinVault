import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionService } from '../../services/transaction.service';
import { format } from 'date-fns';
import { Eye, ArrowUpDown, Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '../../lib/utils';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMM d, yyyy HH:mm:ss');
};

const StatusBadge = ({ status }) => {
  const colors = {
    PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    FAILED: 'bg-red-500/10 text-red-500 border-red-500/20',
    CANCELLED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    EXPIRED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', colors[status] || colors.PENDING)}>
      {status}
    </span>
  );
};

const Pagination = ({ page, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="relative inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Page <span className="font-medium text-slate-200">{page}</span> of{' '}
            <span className="font-medium text-slate-200">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-700 hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ArrowUpDown className="h-4 w-4 -rotate-90" aria-hidden="true" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-700 hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ArrowUpDown className="h-4 w-4 rotate-90" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    sort: 'created_at',
    order: 'desc'
  });

  const [hasMore, setHasMore] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const limit = 10;
      const params = {
        page,
        limit,
        sort: filters.sort,
        order: filters.order
      };
      
      if (filters.type !== 'All') params.type = filters.type;
      if (filters.status !== 'All') params.status = filters.status;

      const data = await transactionService.getHistory(params);
      
      const items = data.transactions || [];
      setTransactions(items);
      setHasMore(items.length === limit);
      // We don't rely on totalPages since the backend doesn't provide it yet
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleRowClick = (tx) => {
    const walletId = tx.walletId || tx.wallet_id;
    navigate(`/transactions/${tx.id}`, { state: { walletId } });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100">Transaction History</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Type</label>
          <select 
            name="type" 
            value={filters.type} 
            onChange={handleFilterChange}
            className="block w-40 bg-slate-800 border-slate-700 text-slate-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="All">All</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAW">Withdraw</option>
            <option value="TRANSFER">Transfer</option>
            <option value="REFUND">Refund</option>
            <option value="REVERSAL">Reversal</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Status</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange}
            className="block w-40 bg-slate-800 border-slate-700 text-slate-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="All">All</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Sort By</label>
          <select 
            name="sort" 
            value={filters.sort} 
            onChange={handleFilterChange}
            className="block w-40 bg-slate-800 border-slate-700 text-slate-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="created_at">Date</option>
            <option value="amount">Amount</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Order</label>
          <select 
            name="order" 
            value={filters.order} 
            onChange={handleFilterChange}
            className="block w-40 bg-slate-800 border-slate-700 text-slate-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                    <p className="text-slate-400 mt-2">Loading transactions...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <p className="text-red-400">{error}</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <p className="text-slate-400">No transactions found.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCredit = ['DEPOSIT', 'REFUND'].includes(tx.type) || (tx.type === 'TRANSFER' && tx.destinationWalletId === tx.walletId);
                  const isDebit = ['WITHDRAW'].includes(tx.type) || (tx.type === 'TRANSFER' && tx.sourceWalletId === tx.walletId);
                  const amountColor = isCredit ? 'text-emerald-500' : isDebit ? 'text-slate-200' : 'text-slate-200';
                  const sign = isCredit ? '+' : isDebit ? '-' : '';

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => handleRowClick(tx)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDateTime(tx.createdAt || tx.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.type}
                        </span>
                      </td>
                      <td className={cn("px-6 py-4 font-medium", amountColor)}>
                        {sign}{Number(tx.amount).toFixed(2)} {tx.currency}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors inline-flex items-center justify-center"
                          aria-label="View transaction details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && !error && (page > 1 || hasMore) && (
          <div className="border-t border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 py-4">
            <span className="text-sm text-slate-400">Page {page}</span>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-sm transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={!hasMore}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-sm transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
