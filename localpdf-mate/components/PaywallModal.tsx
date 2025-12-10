import React, { useState } from 'react';
import { Lock, X, MessageCircle, Mail, Loader2, Check, ScanLine, Copy } from 'lucide-react';
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
  // 建议：图片请命名为 wechat-pay.jpg 和 alipay.jpg 放在 public 文件夹下
  const CONTACT_WECHAT = "18671390652"; 
  const CONTACT_EMAIL = "tangyongr@qq.com";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 增加 max-w-lg 让弹窗更宽，适应大二维码 */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-4 text-white text-center relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 rounded-full p-1 hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-lg font-bold flex items-center justify-center gap-2">
            <Lock size={18} /> 解锁专业版
          </h2>
          <p className="text-brand-100 text-xs mt-1 opacity-90">{reason}</p>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* 1. Payment Tabs */}
          <div className="flex items-center justify-center gap-3 mb-5">
             <button 
               onClick={() => setPaymentMethod('wechat')}
               className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                 paymentMethod === 'wechat' 
                 ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500 ring-offset-1' 
                 : 'border-slate-200 text-slate-500 hover:bg-slate-50'
               }`}
             >
               <MessageCircle size={18} className={paymentMethod === 'wechat' ? 'fill-current' : ''} /> 微信支付
             </button>
             <button 
               onClick={() => setPaymentMethod('alipay')}
               className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                 paymentMethod === 'alipay' 
                 ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-offset-1' 
                 : 'border-slate-200 text-slate-500 hover:bg-slate-50'
               }`}
             >
               <ScanLine size={18} /> 支付宝
             </button>
          </div>

          {/* QR Code Container (Enlarged) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center mb-6 shadow-inner">
            <div className="w-64 h-64 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center overflow-hidden mb-4 relative shadow-sm">
              {/* 
                 请确保您的 /public 文件夹中有 'wechat-pay.jpg' 和 'alipay.jpg' 
              */}
              <img 
                src={paymentMethod === 'wechat' ? '/wechat-pay.jpg' : '/alipay.jpg'} 
                alt="Payment QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // 显示占位提示
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class='text-center text-slate-400 text-xs p-4'>请添加收款码图片到<br/>public/${paymentMethod === 'wechat' ? 'wechat-pay.jpg' : 'alipay.jpg'}</div>`;
                  }
                }}
              />
            </div>
            
            <div className="text-center">
               <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{PRICE_TEXT} <span className="text-sm font-normal text-slate-500">/ 终身</span></p>
               <p className="text-sm text-slate-500 mt-1 font-medium">
                 {paymentMethod === 'wechat' ? '请打开微信 [扫一扫]' : '请打开支付宝 [扫一扫]'}
               </p>
            </div>
          </div>

          {/* 2. Verification Steps & Contact Info */}
          <div className="space-y-4 mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">支付后如何获取激活码？</h4>
            
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 font-medium">发送<span className="text-brand-700 font-bold">支付截图</span>给作者</p>
                  <p className="text-xs text-slate-500 mt-1">请添加微信或发送邮件，我们会尽快回复。</p>
                  
                  {/* Contact Cards */}
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {/* WeChat Card */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                       <div className="flex items-center gap-2 overflow-hidden">
                          <div className="bg-green-100 p-1.5 rounded text-green-600">
                             <MessageCircle size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                             <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">微信号</span>
                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded leading-none border border-emerald-100">手机同号</span>
                             </div>
                             <span className="text-sm font-mono font-bold text-slate-700 truncate">{CONTACT_WECHAT}</span>
                          </div>
                       </div>
                       <button 
                         onClick={() => copyToClipboard(CONTACT_WECHAT, 'wechat')}
                         className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-colors flex items-center gap-1 shadow-sm"
                       >
                         {copiedField === 'wechat' ? <Check size={12} className="text-green-500"/> : <Copy size={12} />}
                         {copiedField === 'wechat' ? '已复制' : '复制'}
                       </button>
                    </div>

                    {/* Email Card */}
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                       <div className="flex items-center gap-2 overflow-hidden">
                          <div className="bg-blue-100 p-1.5 rounded text-blue-600">
                             <Mail size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                             <span className="text-[10px] text-slate-400 font-bold uppercase">邮箱</span>
                             <span className="text-sm font-mono font-bold text-slate-700 truncate">{CONTACT_EMAIL}</span>
                          </div>
                       </div>
                       <button 
                         onClick={() => copyToClipboard(CONTACT_EMAIL, 'email')}
                         className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-colors flex items-center gap-1 shadow-sm"
                       >
                         {copiedField === 'email' ? <Check size={12} className="text-green-500"/> : <Copy size={12} />}
                         {copiedField === 'email' ? '已复制' : '复制'}
                       </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <p className="text-sm text-slate-600 pt-0.5">作者确认后，将直接发送<span className="font-bold text-slate-900 bg-yellow-100 px-1 rounded">激活码</span>给您。</p>
              </div>
            </div>
          </div>

          {/* 3. Input Key */}
          <div className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="text" 
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  setError('');
                }}
                disabled={isVerifying}
                placeholder="收到后在此输入: LP-XXXX-XXXX"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-brand-500 focus:ring-0 outline-none text-center font-mono text-base uppercase transition-all placeholder:text-slate-300"
              />
              {error && <p className="text-red-500 text-xs text-center font-bold animate-pulse">{error}</p>}
              
              <Button type="submit" className="w-full justify-center py-3.5 text-base shadow-lg shadow-brand-200" variant="primary" disabled={isVerifying}>
                {isVerifying ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> 正在验证...</> : '立即激活 Pro'}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
