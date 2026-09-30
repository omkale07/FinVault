import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Wallet, MoreVertical, Edit2, Trash2, Eye, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { walletService } from '../../services/wallet.service';
import { formatCurrency, formatRelativeTime, getApiErrorMessage } from '../../lib/utils';

import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import CreateWalletModal from '../../components/wallets/CreateWalletModal';
import EditWalletModal from '../../components/wallets/EditWalletModal';

export default function WalletsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [balances, setBalances] = useState({});
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const walletsData = await walletService.getAll();
      setWallets(walletsData);
      
      const newBalances = {};
      
      // Fetch sequentially to avoid rate limits
      for (const w of walletsData) {
        try {
          const bal = await walletService.getBalance(w.id);
          newBalances[w.id] = bal?.balance || 0;
        } catch (e) {
          console.warn(`Failed to fetch balance for wallet ${w.id}`, e);
          newBalances[w.id] = 0;
        }
      }
      
      setBalances(newBalances);
    } catch (err) {
      console.error(err);
      setError('Failed to load wallets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete wallet "${name}"?`)) return;
    try {
      await walletService.delete(id);
      toast.success('Wallet deleted successfully');
      fetchWallets();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading Wallets..." />;
  if (error) return <ErrorState message={error} onRetry={fetchWallets} fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Wallets</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your currency accounts and balances.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Plus size={16} /> Create Wallet
        </button>
      </div>

      {wallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wallets.map(wallet => (
            <Card key={wallet.id} className="flex flex-col relative overflow-visible hover:border-slate-600 transition-colors group" noPadding bodyClassName="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <StatusBadge status={wallet.status} />
                <div className="relative">
                  <button 
                    onClick={(e) => toggleMenu(e, wallet.id)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {menuOpenId === wallet.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 overflow-hidden">
                      <button onClick={() => navigate(`/wallets/${wallet.id}`)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                        <Eye size={14} /> View Detail
                      </button>
                      <button onClick={() => navigate(`/wallets/${wallet.id}/transact?type=deposit`)} className="w-full text-left px-4 py-2 text-sm text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 flex items-center gap-2">
                        <ArrowDownToLine size={14} /> Deposit
                      </button>
                      <button onClick={() => navigate(`/wallets/${wallet.id}/transact?type=withdraw`)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                        <ArrowUpFromLine size={14} /> Withdraw
                      </button>
                      <div className="h-px bg-slate-700 my-1"></div>
                      <button onClick={() => { setEditingWallet(wallet); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                        <Edit2 size={14} /> Edit
                      </button>
                      <button onClick={() => { handleDelete(wallet.id, wallet.name); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-2">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-2 mb-6">
                <h3 className="text-lg font-medium text-white truncate" title={wallet.name}>{wallet.name}</h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {formatCurrency(balances[wallet.id] || 0, wallet.currency)}
                </p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{wallet.currency}</p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                <span>Created {formatRelativeTime(wallet.created_at || wallet.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Wallet}
          title="No Wallets Found" 
          description="You don't have any wallets yet. Create one to get started."
          actionLabel="Create Wallet"
          onAction={() => setIsCreateModalOpen(true)}
        />
      )}

      <CreateWalletModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchWallets} 
      />
      
      {editingWallet && (
        <EditWalletModal
          isOpen={!!editingWallet}
          onClose={() => setEditingWallet(null)}
          onSuccess={fetchWallets}
          wallet={editingWallet}
        />
      )}
    </div>
  );
}
