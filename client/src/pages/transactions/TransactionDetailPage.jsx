import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { transactionService } from '../../services/transaction.service';
import { generateIdempotencyKey, getApiErrorMessage } from '../../lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, XCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
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
    <span className={cn('px-3 py-1 rounded-full text-sm font-semibold border', colors[status] || colors.PENDING)}>
      {status}
    </span>
  );
};

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Generate once per page load for this specific transaction process operation
  const [idempotencyKey] = useState(generateIdempotencyKey());

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        let walletId = location.state?.walletId;
        
        if (!walletId) {
          const historyRes = await transactionService.getHistory({ page: 1, limit: 50 });
          const items = historyRes.transactions || [];
          const tx = items.find(t => t.id === id);
          if (tx) {
            walletId = tx.walletId || tx.wallet_id;
          } else {
            throw new Error('Transaction not found in recent history to determine wallet.');
          }
        }

        const transactionData = await transactionService.getById(walletId, id);
        setTransaction(transactionData);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, location.state]);

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const walletId = transaction.walletId || transaction.wallet_id;
      const response = await transactionService.cancel({ walletId, transactionId: id });
      
      const status = response.status || response.transaction?.status;
      if (status) {
        toast.success('Transaction cancelled successfully');
        setTransaction(response.transaction || response || { ...transaction, status: 'CANCELLED' });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
      setShowCancelConfirm(false);
    }
  };

  const handleProcess = async () => {
    try {
      setActionLoading(true);
      const response = await transactionService.process({
        transactionId: id,
        idempotencyKey
      });
      
      const status = response.status || response.transaction?.status;
      
      if (status === 'COMPLETED') {
        toast.success('Transaction processed successfully');
        setTransaction(response.transaction || response || { ...transaction, status: 'COMPLETED' });
      } else {
        toast.error(`Transaction ${status || 'failed'}`);
        if (response) setTransaction(response.transaction || response);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-400">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => navigate('/transactions')} className="flex items-center text-slate-400 hover:text-slate-200 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Transactions
        </button>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Transaction</h2>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!transaction) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/transactions')} className="flex items-center text-slate-400 hover:text-slate-200 mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Transactions
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              Transaction Details
              <StatusBadge status={transaction.status} />
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-mono">ID: {transaction.id}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-100">
              {Number(transaction.amount).toFixed(2)} <span className="text-xl text-slate-400">{transaction.currency}</span>
            </div>
            <div className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider">
              {transaction.type}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/30 rounded-lg p-5 border border-slate-700/50 mb-8">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Wallet ID</p>
            <p className="text-sm font-mono text-slate-200">{transaction.walletId || transaction.wallet_id}</p>
          </div>
          {transaction.referenceId && (
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">Reference ID</p>
              <p className="text-sm font-mono text-slate-200">{transaction.referenceId}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Created At</p>
            <p className="text-sm text-slate-200">{formatDateTime(transaction.createdAt || transaction.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Updated At</p>
            <p className="text-sm text-slate-200">{formatDateTime(transaction.updatedAt || transaction.updated_at)}</p>
          </div>
        </div>

        {/* Timeline Indicator */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Lifecycle Status</h3>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-400 mt-2 font-medium">Created</span>
            </div>
            <div className={cn("flex-1 h-0.5", transaction.status === 'PENDING' ? 'bg-slate-700' : 'bg-emerald-500/50')} />
            <div className="flex flex-col items-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", 
                transaction.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 
                transaction.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 
                'bg-slate-700 text-slate-400 border-slate-600'
              )}>
                {transaction.status === 'PENDING' ? <Clock className="w-5 h-5" /> : 
                 transaction.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> : 
                 <XCircle className="w-5 h-5" />}
              </div>
              <span className="text-xs text-slate-400 mt-2 font-medium">Processed</span>
            </div>
            <div className={cn("flex-1 h-0.5", transaction.status === 'COMPLETED' || transaction.status === 'FAILED' || transaction.status === 'CANCELLED' ? 'bg-emerald-500/50' : 'bg-slate-700')} />
            <div className="flex flex-col items-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", 
                transaction.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 
                transaction.status === 'FAILED' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 
                transaction.status === 'CANCELLED' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                'bg-slate-800 text-slate-500 border-slate-700'
              )}>
                {transaction.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> : 
                 transaction.status === 'FAILED' ? <XCircle className="w-5 h-5 text-red-500" /> : 
                 transaction.status === 'CANCELLED' ? <XCircle className="w-5 h-5" /> :
                 <div className="w-2 h-2 rounded-full bg-slate-500" />}
              </div>
              <span className="text-xs text-slate-400 mt-2 font-medium">Final</span>
            </div>
          </div>
        </div>

        {transaction.status === 'PENDING' && (
          <div className="flex gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel Transaction
            </button>
            <button
              onClick={handleProcess}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Process Transaction
            </button>
          </div>
        )}
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Cancel Transaction?</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to cancel this transaction? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCancelConfirm(false)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                No, keep it
              </button>
              <button 
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
