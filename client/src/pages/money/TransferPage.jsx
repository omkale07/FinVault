import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletService } from '../../services/wallet.service';
import { transactionService } from '../../services/transaction.service';
import { generateIdempotencyKey, getApiErrorMessage } from '../../lib/utils';
import { Loader2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransferPage() {
  const navigate = useNavigate();

  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sourceWalletId, setSourceWalletId] = useState('');
  const [destinationWalletId, setDestinationWalletId] = useState('');
  const [amount, setAmount] = useState('');
  
  const [step, setStep] = useState('FORM'); // FORM, CONFIRM, PROCESSING, RESULT
  const [processResult, setProcessResult] = useState(null);

  const [idempotencyKey, setIdempotencyKey] = useState(null);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoading(true);
        const res = await walletService.getAll();
        const wList = res || [];
        setWallets(wList);
        if (wList.length > 0) {
          setSourceWalletId(String(wList[0].id));
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchWallets();
  }, []);

  const selectedWallet = wallets.find(w => String(w.id) === sourceWalletId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sourceWalletId || !destinationWalletId || !amount) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (sourceWalletId === destinationWalletId) {
      toast.error('Source and destination wallets cannot be the same.');
      return;
    }
    if (Number(amount) <= 0) {
      toast.error('Please enter a valid positive amount.');
      return;
    }
    setIdempotencyKey(generateIdempotencyKey());
    setStep('CONFIRM');
  };

  const executeTransfer = async () => {
    setStep('PROCESSING');
    
    try {
      const res = await transactionService.transfer({
        walletId: sourceWalletId,
        destinationWalletId,
        amount: Number(amount),
        currency: selectedWallet.currency,
        idempotencyKey
      });

      // The backend returns sourceTransaction and destinationTransaction
      const sourceTransaction = res.sourceTransaction || res;
      const status = sourceTransaction.status || res.status;

      if (status === 'COMPLETED') {
        setProcessResult({ success: true, message: 'Transfer completed successfully.' });
        toast.success('Transfer completed');
      } else {
        setProcessResult({ 
          success: false, 
          message: `Transfer ${status || 'failed'}.` 
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

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Transfer Funds</h1>

        {step === 'FORM' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Source Wallet</label>
                <select
                  value={sourceWalletId}
                  onChange={(e) => setSourceWalletId(e.target.value)}
                  className="block w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-3"
                  required
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency}) - {String(w.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 text-slate-400">
                  <ArrowRight className="w-5 h-5 transform rotate-90 md:rotate-0" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Destination Wallet ID</label>
                <input
                  type="text"
                  value={destinationWalletId}
                  onChange={(e) => setDestinationWalletId(e.target.value)}
                  className="block w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-3"
                  placeholder="Enter destination wallet ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full bg-slate-800 border-slate-700 text-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-3 pl-4 pr-16"
                    placeholder="0.00"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-slate-500 sm:text-sm font-medium">
                      {selectedWallet?.currency || 'USD'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors focus:ring-offset-slate-900"
            >
              Continue Transfer
            </button>
          </form>
        )}

        {step === 'CONFIRM' && selectedWallet && (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-semibold text-slate-100">Confirm Transfer</h2>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 inline-block w-full mx-auto">
              <p className="text-slate-300 mb-4 text-lg">You are transferring</p>
              <div className="text-4xl font-bold text-emerald-400 mb-6">
                {Number(amount).toFixed(2)} <span className="text-xl text-slate-400">{selectedWallet.currency}</span>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-left bg-slate-900/50 p-4 rounded-md border border-slate-700/50">
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">From</p>
                  <p className="text-slate-200 font-medium">{selectedWallet.name}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />
                <div className="flex-1 text-right md:text-left">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">To Wallet ID</p>
                  <p className="text-slate-200 font-mono text-sm break-all">{destinationWalletId}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep('FORM')}
                className="flex-1 py-3 px-4 border border-slate-700 rounded-md text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={executeTransfer}
                className="flex-1 py-3 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        )}

        {step === 'PROCESSING' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
            <h3 className="text-lg font-medium text-slate-200">Processing Transfer...</h3>
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
                {processResult.success ? 'Transfer Successful' : 'Transfer Failed'}
              </h3>
              <p className="text-slate-300">{processResult.message}</p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => {
                  setAmount('');
                  setDestinationWalletId('');
                  setStep('FORM');
                  setProcessResult(null);
                }}
                className="w-full py-3 px-4 border border-slate-700 rounded-md text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Make Another Transfer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
