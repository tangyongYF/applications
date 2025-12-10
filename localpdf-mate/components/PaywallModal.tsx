import React, { useState } from 'react';
import { Lock, X, CheckCircle, Loader2, MessageCircle, Copy, Check, QrCode, ScanLine } from 'lucide-react';
import { activateLicense } from '../services/storageService';
import Button from './ui/Button';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason: string;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onSuccess, reason }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // --- 🔴 请配置您的信息 🔴 ---
  const CONTACT_WECHAT = "18671390652"; 
  const CONTACT_EMAIL = "tangyongr@qq.com"; // 请替换您的真实邮箱
  const PRICE_TEXT = "¥19.9";

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = licenseKey.trim();
    
    if (!cleanKey) {
      setError('请输入激活码');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanKey }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        activateLicense(cleanKey, data.expiresAt);
        onSuccess();
        onClose();
      } else {
        setError(data.error || '激活码无效或已被使用');
      }
    } catch (err) {
      setError('网络连接失败，请检查网络');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-4 text-white text-center relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={24} />
          </button>
          <h2 className="text-lg font-bold flex items-center justify-center gap-2">
            <Lock size={18} /> 解锁专业版
          </h2>
          <p className="text-brand-100 text-xs mt-1 opacity-90">{reason}</p>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar">
          
          {/* 1. Payment Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
               <button 
                 onClick={() => setPaymentMethod('wechat')}
                 className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                   paymentMethod === 'wechat' 
                   ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' 
                   : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                 }`}
               >
                 <MessageCircle size={16} /> 微信支付
               </button>
               <button 
                 onClick={() => setPaymentMethod('alipay')}
                 className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                   paymentMethod === 'alipay' 
                   ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                   : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                 }`}
               >
                 <ScanLine size={16} /> 支付宝
               </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center">
              <div className="w-40 h-40 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden mb-3 relative group">
                {/* 
                   🔴 关键步骤：请将您的收款码截图重命名为 'wechat-pay.jpg' 和 'alipay.jpg' 
                   并放入项目的 /public 文件夹中 
                */}
                <img 
                  src={paymentMethod === 'wechat' ? '/wechat-pay.jpg' : '/alipay.jpg'} 
                  alt="Payment QR Code"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback visual if image not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-slate-100');
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center pointer-events-none" style={{display: 'none'}}> 
                   请在 public 目录添加<br/>{paymentMethod === 'wechat' ? 'wechat-pay.jpg' : 'alipay.jpg'}
                </div>
              </div>
              
              <p className="text-2xl font-bold text-slate-900">{PRICE_TEXT}</p>
              <p className="text-xs text-slate-500 mt-1">
                {paymentMethod === 'wechat' ? '请使用微信扫一扫' : '请使用支付宝扫一扫'}
              </p>
            </div>
          </div>

          {/* 2. Verification Steps */}
          <div className="space-y-3 mb-6 bg-white p-3 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 text-center">支付后如何获取激活码？</h4>
            
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
              <div>
                <p className="text-slate-600">添加作者微信，发送<span className="font-bold text-slate-900">支付截图</span>。</p>
                <div className="flex items-center gap-2 mt-1.5 p-1.5 bg-slate-50 rounded border border-slate-200 w-fit">
                   <span className="font-mono font-medium text-slate-800 text-xs">{CONTACT_WECHAT}</span>
                   <button 
                    onClick={() => copyToClipboard(CONTACT_WECHAT, 'wechat')}
                    className="text-xs text-brand-600 font-bold hover:underline"
                   >
                    {copiedField === 'wechat' ? '已复制' : '复制微信号'}
                   </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
              <p className="text-slate-600">作者确认后，将直接发送<span className="font-bold text-brand-600">激活码</span>给您。</p>
            </div>
          </div>

          {/* 3. Input Key */}
          <div className="border-t border-slate-100 pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="text" 
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  setError('');
                }}
                disabled={isVerifying}
                placeholder="在此输入激活码: LP-XXXX-XXXX"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-center font-mono text-sm uppercase transition-all"
              />
              {error && <p className="text-red-500 text-xs text-center font-medium animate-pulse">{error}</p>}
              
              <Button type="submit" className="w-full justify-center" variant="primary" disabled={isVerifying}>
                {isVerifying ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> 验证中...</> : '立即激活'}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
