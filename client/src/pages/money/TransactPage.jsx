import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { walletService } from '../../services/wallet.service';
import { transactionService } from '../../services/transaction.service';
import { generateIdempotencyKey, getApiErrorMessage } from '../../lib/utils';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransactPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type');

  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [type, setType] = useState(typeParam === 'withdraw' ? 'WITHDRAW' : 'DEPOSIT');
  const [amount, setAmount] = useState('');
  
  const [step, setStep] = useState('FORM'); // FORM, CONFIRM, PROCESSING, RESULT
  const [processResult, setProcessResult] = useState(null);

  const [idempotencyKey, setIdempotencyKey] = useState(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const [walletRes, balanceRes] = await Promise.all([
          walletService.getById(id),
          walletService.getBalance(id)
        ]);

        setWallet(walletRes);
        setBalance(balanceRes);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid positive amount.');
      return;
    }
    setIdempotencyKey(generateIdempotencyKey());
    setStep('CONFIRM');
  };

  const executeTransaction = async () => {
    setStep('PROCESSING');
    
    try {
      // Step 1: Create transaction (Pending state)
      const createRes = await transactionService.create({
        walletId: id,
        type,
        amount: Number(amount),
        currency: wallet.currency
      });

      const txId = createRes.id || createRes.transaction?.id;
      if (!txId) throw new Error('Transaction ID not returned from create.');

      // Step 2: Process transaction (Finalize)
      const processRes = await transactionService.process({
        transactionId: txId,
        idempotencyKey
      });
      
      const status = processRes.status || processRes.transaction?.status;
      
      if (processRes.success || status === 'COMPLETED') {
        setProcessResult({ success: true, message: `${type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} completed successfully.` });
        toast.success(`${type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} completed`);
        // Refresh balance
        const balRes = await walletService.getBalance(id);
        setBalance(balRes);
      } else {
        setProcessResult({ 
          success: false, 
          message: `Transaction ${status || 'failed'}.` 
        });
      }
    } catch (err) {
      setProcessResult({ success: false, message: getApiErrorMessage(err) });
      toast.error(getApiErrorMessage(err));
    } finally {
      setStep('RESULT');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate('/wallets')} className="flex items-center text-slate-400 hover:text-slate-200 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Wallets
        </button>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400">
          {error || 'Wallet not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(`/wallets/${id}`)} className="flex items-center text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Wallet
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Transact</h1>

        {step === 'FORM' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex rounded-lg bg-slate-800/50 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setType('DEPOSIT')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" /> Deposit
              </button>
              <button
                type="button"
                onClick={() => setType('WITHDRAW')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center transition-colors ${type === 'WITHDRAW' ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" /> Withdraw
              </button>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 flex justify-between items-center border border-slate-700/50">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Wallet</p>
                <p className="text-slate-200 font-medium">{wallet.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Available Balance</p>
                <p className="text-slate-200 font-mono font-medium">
                  {Number(balance?.balance || 0).toFixed(2)} <span className="text-slate-500 text-sm">{wallet.currency}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Amount</label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full rounded-md border-slate-700 bg-slate-800/50 pl-4 pr-12 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-3"
                  placeholder="0.00"
                  required
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-slate-500 sm:text-sm font-medium">{wallet.currency}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors focus:ring-offset-slate-900"
            >
              Continue
            </button>
          </form>
        )}

        {step === 'CONFIRM' && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-semibold text-slate-100">Confirm Transaction</h2>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 inline-block w-full max-w-md mx-auto">
              <p className="text-slate-300 mb-4 text-lg">
                You are about to {type === 'DEPOSIT' ? <span className="text-emerald-400 font-bold">deposit</span> : <span className="text-slate-200 font-bold">withdraw</span>} 
              </p>
              <div className="text-4xl font-bold text-slate-100 mb-4">
                {Number(amount).toFixed(2)} <span className="text-xl text-slate-400">{wallet.currency}</span>
              </div>
              <p className="text-slate-400">
                {type === 'DEPOSIT' ? 'to' : 'from'} <span className="font-medium text-slate-200">{wallet.name}</span>
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep('FORM')}
                className="flex-1 py-3 px-4 border border-slate-700 rounded-md text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={executeTransaction}
                className="flex-1 py-3 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
            <h3 className="text-lg font-medium text-slate-200">Processing Transaction...</h3>
            <p className="text-sm text-slate-400">Transaction created, waiting for final status.</p>
          </div>
        )}

        {step === 'RESULT' && processResult && (
          <div className="py-8 text-center space-y-6">
            <div className="flex justify-center">
              {processResult.success ? (
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
              )}
            </div>
            
            <div>
              <h3 className={`text-xl font-bold mb-2 ${processResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {processResult.success ? 'Transaction Successful' : 'Transaction Failed'}
              </h3>
              <p className="text-slate-300">{processResult.message}</p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  setAmount('');
                  setStep('FORM');
                  setProcessResult(null);
                }}
                className="w-full py-3 px-4 border border-slate-700 rounded-md text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Make Another Transaction
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
