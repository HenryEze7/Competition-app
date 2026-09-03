import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BuyPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BuyPointsModal({ isOpen, onClose }: BuyPointsModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(1000);
  const [step, setStep] = useState<'input' | 'payment'>('input');

  if (!isOpen || !user) return null;

  // Configuration for EmpresaPay
  const baseUrl = 'https://empresa-pay-gate.onrender.com';
  
  // Use environment variable for business slug if available, default to "demo-business"
  const businessSlug = import.meta.env.VITE_EMPRESA_BUSINESS_SLUG || 'demo-business';
  
  // Generate a unique reference for this transaction
  const reference = `ORDER-${new Date().getTime()}`;
  
  // URL to redirect back to inside the iframe upon completion
  const redirectUrl = window.location.origin;

  const params = new URLSearchParams({
    amount: amount.toString(),
    ref: reference,
    email: user.email || '',
    uid: user.uid,
    redirectUrl
  });

  const paymentUrl = `${baseUrl}/pay/${businessSlug}?${params.toString()}`;

  const handleClose = () => {
    setStep('input');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-2xl w-full ${step === 'payment' ? 'max-w-5xl h-[90vh]' : 'max-w-md'} shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all`}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">
            {step === 'input' ? 'Buy Points' : 'Complete Payment'}
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'input' ? (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Amount</label>
              <div className="grid grid-cols-3 gap-3">
                {[500, 1000, 2000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      amount === val
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    ₦{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Custom Amount (₦)</label>
              <input
                type="number"
                min="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <button
              onClick={() => setStep('payment')}
              disabled={amount < 100}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              Continue to Payment
            </button>
          </div>
        ) : (
          <div className="flex-1 w-full bg-slate-50 relative">
            <iframe
              src={paymentUrl}
              className="absolute inset-0 w-full h-full border-0"
              title="EmpresaPay Gateway"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
            />
          </div>
        )}
      </div>
    </div>
  );
}

