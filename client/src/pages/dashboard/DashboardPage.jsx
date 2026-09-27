import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Plus, Activity, Clock, CreditCard } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'react-hot-toast';

import { walletService } from '../../services/wallet.service';
import { transactionService } from '../../services/transaction.service';
import { formatCurrency, formatRelativeTime, getAmountSign, getAmountColor, getStatusColor } from '../../lib/utils';

import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import CreateWalletModal from '../../components/wallets/CreateWalletModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [balances, setBalances] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const wallets = await walletService.getAll();
      setWallets(wallets);
      
      const newBalances = {};
      
      // Fetch sequentially to prevent blasting the backend and triggering 429 Too Many Requests
      for (const w of wallets) {
        try {
          const bal = await walletService.getBalance(w.id);
          newBalances[w.id] = bal?.balance || 0;
        } catch (e) {
          console.warn(`Failed to fetch balance for wallet ${w.id}`, e);
          newBalances[w.id] = 0;
        }
      }
      
      setBalances(newBalances);

      const txData = await transactionService.getHistory({ page: 1, limit: 10, sort: 'created_at', order: 'desc' });
      setRecentTransactions(txData.transactions || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleWalletCreated = () => {
    fetchDashboardData();
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading Dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboardData} fullScreen />;

  // Group balances by currency
  const currencyTotals = wallets.reduce((acc, wallet) => {
    const bal = balances[wallet.id] || 0;
    if (!acc[wallet.currency]) {
      acc[wallet.currency] = { balance: 0, count: 0 };
    }
    acc[wallet.currency].balance += bal;
    acc[wallet.currency].count += 1;
    return acc;
  }, {});

  // Chart data
  const chartData = [...recentTransactions]
    .reverse()
    .map(tx => ({
      name: formatRelativeTime(tx.created_at || tx.createdAt),
      amount: parseFloat(tx.amount || 0),
      type: tx.type
    }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Plus size={16} /> Create Wallet
          </button>
          <button
            onClick={() => navigate('/transfer')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition-colors font-medium text-sm"
          >
            <ArrowRightLeft size={16} /> Transfer
          </button>
        </div>
      </div>

      {/* Currency Balance Cards */}
      {Object.keys(currencyTotals).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(currencyTotals).map(([currency, data]) => (
            <div key={currency} className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-800/30 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet size={64} />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total {currency} Balance</p>
              <h2 className="text-3xl font-bold text-white mb-2">{formatCurrency(data.balance, currency)}</h2>
              <p className="text-xs text-slate-500">{data.count} Wallet{data.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Wallet}
          title="No Wallets Found" 
          description="Create your first wallet to start managing your funds."
          actionLabel="Create Wallet"
          onAction={() => setIsCreateModalOpen(true)}
        />
      )}

      {/* Wallet Cards */}
      {wallets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-200 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-500" /> Your Wallets
            </h2>
            <Link to="/wallets" className="text-sm text-emerald-500 hover:text-emerald-400">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {wallets.slice(0, 4).map(wallet => (
              <Card key={wallet.id} className="hover:border-slate-600 transition-colors" noPadding bodyClassName="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-medium truncate" title={wallet.name}>{wallet.name}</h3>
                    <p className="text-xs text-slate-400">{wallet.currency}</p>
                  </div>
                  <StatusBadge status={wallet.status} />
                </div>
                <div className="mb-4">
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(balances[wallet.id] || 0, wallet.currency)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/wallets/${wallet.id}`} className="flex-1 text-center py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded transition-colors">
                    View
                  </Link>
                  <Link to={`/wallets/${wallet.id}/transact?type=deposit`} className="flex-1 text-center py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 text-xs font-medium rounded transition-colors">
                    Deposit
                  </Link>
                  <Link to={`/wallets/${wallet.id}/transact?type=withdraw`} className="flex-1 text-center py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium rounded transition-colors">
                    Withdraw
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Activity Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-1 flex flex-col h-[400px]" noPadding bodyClassName="p-5 flex-1 flex flex-col min-h-0">
          <h2 className="text-lg font-medium text-slate-200 flex items-center gap-2 mb-4">
            <Activity size={18} className="text-emerald-500" /> Activity Overview
          </h2>
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={[0, dataMax => (dataMax === 0 ? 100 : dataMax * 1.2)]} />
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              No recent activity to display
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2 flex flex-col h-[400px]" noPadding bodyClassName="p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-200 flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" /> Recent Transactions
            </h2>
            <Link to="/transactions" className="text-sm text-emerald-500 hover:text-emerald-400">View All</Link>
          </div>
          
          <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-500' : tx.type === 'WITHDRAW' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {tx.type === 'DEPOSIT' ? <ArrowDownToLine size={16} /> : tx.type === 'WITHDRAW' ? <ArrowUpFromLine size={16} /> : <ArrowRightLeft size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{tx.type.toLowerCase()} {tx.description ? `- ${tx.description}` : ''}</p>
                        <p className="text-xs text-slate-400">{formatRelativeTime(tx.created_at || tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`text-sm font-semibold ${getAmountColor(tx.type)}`}>
                        {getAmountSign(tx.type)}{formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <StatusBadge status={tx.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Clock size={32} className="opacity-20" />
                <p className="text-sm">No recent transactions</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <CreateWalletModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handleWalletCreated} 
      />
    </div>
  );
}
