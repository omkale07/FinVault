import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, 
  Edit2, Trash2, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { walletService } from '../../services/wallet.service';
import { transactionService } from '../../services/transaction.service';
import { formatCurrency, formatRelativeTime, getAmountSign, getAmountColor, getApiErrorMessage } from '../../lib/utils';

import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import EditWalletModal from '../../components/wallets/EditWalletModal';

export default function WalletDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  
  const [txLoading, setTxLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [walletRes, balanceRes] = await Promise.all([
        walletService.getById(id),
        walletService.getBalance(id)
      ]);
      
      setWallet(walletRes);
      setBalance(balanceRes.balance || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load wallet details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (page = 1) => {
    try {
      setTxLoading(true);
      const res = await transactionService.getByWallet(id, { page, limit: 10, sort: 'created_at', order: 'desc' });
      const items = res.transactions || [];
      setTransactions(items);
      setPagination({
        page: page,
        limit: 10,
        hasMore: items.length === 10
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${wallet?.name}"?`)) return;
    try {
      await walletService.delete(id);
      toast.success('Wallet deleted successfully');
      navigate('/wallets');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading Wallet Details..." />;
  if (error) return <ErrorState message={error} onRetry={fetchWalletData} fullScreen />;
  if (!wallet) return <EmptyState title="Wallet Not Found" actionLabel="Back to Wallets" onAction={() => navigate('/wallets')} />;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/wallets')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Wallets
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors" title="Edit Wallet">
            <Edit2 size={16} />
          </button>
          <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors" title="Delete Wallet">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{wallet.name}</h1>
              <StatusBadge status={wallet.status} />
            </div>
            <p className="text-sm text-slate-400 mb-6 font-mono">ID: {wallet.id}</p>
            
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Available Balance</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
              {formatCurrency(balance, wallet.currency)}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/wallets/${id}/transact?type=deposit`)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
            >
              <ArrowDownToLine size={18} /> Deposit
            </button>
            <button
              onClick={() => navigate(`/wallets/${id}/transact?type=withdraw`)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              <ArrowUpFromLine size={18} /> Withdraw
            </button>
            <button
              onClick={() => navigate('/transfer')}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 rounded-lg transition-colors font-medium"
            >
              <ArrowRightLeft size={18} /> Transfer
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400">
          <p>Created: <span className="text-slate-300">{formatRelativeTime(wallet.createdAt)}</span></p>
          <p>Last Updated: <span className="text-slate-300">{formatRelativeTime(wallet.updatedAt)}</span></p>
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Clock size={18} className="text-slate-400" /> Transaction History
          </h3>
        </div>
        
        <div className="p-0">
          {txLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner /></div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-6 py-4 capitalize font-medium text-white">
                        <div className="flex items-center gap-2">
                          {tx.type === 'DEPOSIT' && <ArrowDownToLine size={14} className="text-emerald-500" />}
                          {tx.type === 'WITHDRAW' && <ArrowUpFromLine size={14} className="text-red-500" />}
                          {tx.type === 'TRANSFER' && <ArrowRightLeft size={14} className="text-blue-500" />}
                          {tx.type.toLowerCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 truncate max-w-xs">{tx.description || '-'}</td>
                      <td className="px-6 py-4"><StatusBadge status={tx.status} size="sm" /></td>
                      <td className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${getAmountColor(tx.type)}`}>
                        {getAmountSign(tx.type)}{formatCurrency(tx.amount, tx.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              {(pagination.page > 1 || pagination.hasMore) && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/30">
                  <span className="text-sm text-slate-400">
                    Page {pagination.page}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      disabled={pagination.page <= 1}
                      onClick={() => fetchTransactions(pagination.page - 1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-sm transition-colors"
                    >
                      Previous
                    </button>
                    <button 
                      disabled={!pagination.hasMore}
                      onClick={() => fetchTransactions(pagination.page + 1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-sm transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState title="No transactions yet" description="Deposit funds to get started." />
            </div>
          )}
        </div>
      </Card>

      {isEditModalOpen && (
        <EditWalletModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchWalletData();
            setIsEditModalOpen(false);
          }}
          wallet={wallet}
        />
      )}
    </div>
  );
}
