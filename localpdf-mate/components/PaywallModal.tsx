import React, { useState } from 'react';
import { Lock, X, CheckCircle, ShieldCheck, CreditCard, QrCode, Loader2 } from 'lucide-react';
import { activateLicense } from '../services/storageService';
import Button from './ui/Button';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason: string;
}

// TEMPORARY PLACEHOLDERS FOR INITIAL DEPLOYMENT
const LINK_GLOBAL = "#"; 
const LINK_CHINA = "#";  

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onSuccess, reason }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = licenseKey.trim();
    
    if (!cleanKey) {
      setError('Please enter a license key.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 调用 Vercel Serverless Function
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: cleanKey }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 验证成功，保存到本地
        activateLicense(cleanKey, data.expiresAt);
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Invalid License Key.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-5 text-white text-center relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={24} />
          </button>
          <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold">Unlock Unlimited Access</h2>
          <p className="text-brand-100 mt-1 text-sm px-4">{reason}</p>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-slate-700">
              <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm font-medium">Unlimited files & sizes (No 10MB limit)</p>
            </div>
            <div className="flex items-start gap-3 text-slate-700">
              <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm">Batch processing (Merge 100+ files)</p>
            </div>
            <div className="flex items-start gap-3 text-slate-700">
              <ShieldCheck className="text-green-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm">100% Private (Your data stays on device)</p>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
            <div className="text-center mb-4">
               <p className="text-slate-500 text-sm">One-time payment. 1-Year Access.</p>
               <p className="text-3xl font-bold text-slate-900 mt-1">$2.99 <span className="text-sm font-normal text-slate-400">/ ¥19.9</span></p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Global */}
              <a 
                href={LINK_GLOBAL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-[#111] hover:bg-black text-white py-2.5 rounded-lg font-medium transition-colors group"
              >
                <CreditCard size={18} className="text-gray-300 group-hover:text-white" />
                <span>Subscribe via Creem</span>
              </a>

              {/* Option 2: China */}
              <a 
                href={LINK_CHINA}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-[#07c160] hover:bg-[#06ad56] text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                <QrCode size={18} />
                <span>微信支付 / Alipay</span>
              </a>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-3">
              1. Click to Pay &rarr; 2. Receive Code via Email &rarr; 3. Enter Code below
            </p>
          </div>

          {/* Activation Form */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="px-2 bg-white text-slate-400">Activate License</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input 
                type="text" 
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  setError('');
                }}
                disabled={isVerifying}
                placeholder="Enter License Key from Email"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-center font-mono text-sm uppercase disabled:opacity-50 disabled:bg-slate-100"
              />
              {error && <p className="text-red-500 text-xs mt-1 text-center font-medium animate-pulse">{error}</p>}
            </div>
            <Button type="submit" className="w-full justify-center" variant="secondary" disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> Verifying...
                </>
              ) : (
                'Unlock Now'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;