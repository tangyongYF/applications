import React, { useState } from 'react';
import { Lock, X, CheckCircle, Loader2, MessageCircle, Mail, Check } from 'lucide-react';
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 配置您的联系方式
  const CONTACT_WECHAT = "18671390652"; 
  const CONTACT_EMAIL = "tangyongr@qq.com"; // 请替换您的真实邮箱

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
      // 调用后端 API 进行严格验证
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: cleanKey }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 验证成功！
        activateLicense(cleanKey, data.expiresAt);
        onSuccess();
        onClose();
      } else {
        // 验证失败
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-5 text-white text-center relative shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={24} />
          </button>
          <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold">解锁专业版功能</h2>
          <p className="text-brand-100 mt-1 text-sm px-4">{reason}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-slate-700">
              <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm font-medium">无限文件数量 & 大小</p>
            </div>
            <div className="flex items-start gap-3 text-slate-700">
              <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm">支持批量处理 (100+ 文件)</p>
            </div>
          </div>

          {/* Manual Payment Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
            <div className="text-center mb-4 border-b border-slate-200 pb-3">
               <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">如何获取激活码？</p>
               <p className="text-2xl font-bold text-slate-900 mt-2">¥19.9 <span className="text-sm font-normal text-slate-400">/ 终身授权</span></p>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">1</span>
                <p>扫描微信/支付宝二维码支付，或转账给作者。</p>
              </div>
              
              <div className="flex gap-3">
                 <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">2</span>
                 <p>发送<span className="font-bold text-slate-900">支付截图</span>给作者 (微信或邮件)。</p>
              </div>

              {/* Contact Info Box */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                {/* WeChat */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MessageCircle size={16} className="text-green-600" />
                    <span className="font-medium">微信:</span>
                    <span className="font-mono bg-slate-100 px-1 rounded">{CONTACT_WECHAT}</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(CONTACT_WECHAT, 'wechat')}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    {copiedField === 'wechat' ? <span className="flex items-center text-green-600"><Check size={12} className="mr-1"/>已复制</span> : '复制'}
                  </button>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail size={16} className="text-blue-500" />
                    <span className="font-medium">邮箱:</span>
                    <span className="font-mono bg-slate-100 px-1 rounded truncate max-w-[120px] sm:max-w-none">{CONTACT_EMAIL}</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(CONTACT_EMAIL, 'email')}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    {copiedField === 'email' ? <span className="flex items-center text-green-600"><Check size={12} className="mr-1"/>已复制</span> : '复制'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                 <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">3</span>
                 <p>作者确认后，将人工发送<span className="font-bold text-slate-900">激活码</span>给您。</p>
              </div>
            </div>
          </div>

          {/* Activation Form */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="px-2 bg-white text-slate-400">收到码后在此输入</span>
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
                placeholder="LP-XXXX-XXXX"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-center font-mono text-sm uppercase disabled:opacity-50 disabled:bg-slate-100"
              />
              {error && <p className="text-red-500 text-xs mt-1 text-center font-medium animate-pulse">{error}</p>}
            </div>
            <Button type="submit" className="w-full justify-center" variant="secondary" disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" /> 验证中...
                </>
              ) : (
                '立即解锁'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
