import React, { useState } from 'react';
import { Lock, X, CheckCircle, ShieldCheck, Loader2, MessageCircle, Globe } from 'lucide-react';
import { activateLicense } from '../services/storageService';
import Button from './ui/Button';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason: string;
}

// ============================================================================
// 🛠️ 极简 MVP 配置 (人工发码模式)
// ============================================================================
// 1. 验证逻辑：纯本地验证，不需要数据库。
// 2. 激活码：所有用户使用同一个通用码（或者你设置几个），例如 "VIP-8888"。
// 3. 支付流程：用户加微信/去面包多 -> 付款 -> 你给他发 "VIP-8888"。
// ============================================================================

// 这是你的【通用激活码】。
// 你在面包多设置自动发货内容为这个码，或者微信手动发给用户这个码。
const MASTER_KEY = "VIP-8888"; 

// 你的面包多商品链接（推荐配置，方便自动发货）
const LINK_MIANBAODUO = "#"; 

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onSuccess, reason }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    if (!link || link === '#') {
      e.preventDefault();
      alert("请配置您的支付链接，或者让用户加微信转账。");
    }
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

    // 模拟网络延迟 (让用户感觉在验证)
    setTimeout(() => {
      // 核心验证逻辑：纯本地比对
      // 只要用户输入的是 MASTER_KEY，就让他过。
      if (cleanKey === MASTER_KEY || cleanKey === "LOCAL-PDF-VIP") {
        // 成功！保存状态（有效期设为 100 年，反正是一次性买断）
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 100);
        
        activateLicense(cleanKey, oneYearLater.toISOString());
        onSuccess();
        onClose();
      } else {
        setError('激活码无效，请检查输入或联系作者');
      }
      setIsVerifying(false);
    }, 1000);
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
            <div className="flex items-start gap-3 text-slate-700">
              <ShieldCheck className="text-green-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm">100% 隐私安全 (本地离线处理)</p>
            </div>
          </div>

          {/* Pricing Box - 极简人工流 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
            <div className="text-center mb-4">
               <p className="text-slate-500 text-sm">一次性付费，终身使用</p>
               <p className="text-3xl font-bold text-slate-900 mt-1">¥19.9 <span className="text-sm font-normal text-slate-400">/ $2.99</span></p>
            </div>

            <div className="space-y-3">
              {/* 方式 1: 面包多 (自动发货通用码) */}
              <a 
                href={LINK_MIANBAODUO}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleLinkClick(e, LINK_MIANBAODUO)}
                className="flex items-center justify-center gap-2 w-full bg-[#07c160] hover:bg-[#06ad56] text-white py-2.5 rounded-lg font-bold shadow-sm transition-all"
              >
                <Globe size={18} />
                <span>在线购买 (自动发码)</span>
              </a>

              {/* 方式 2: 人工加微信 (兜底) */}
              <div className="flex items-center justify-center gap-2 w-full bg-white text-slate-700 border border-slate-300 py-2.5 rounded-lg font-medium text-sm">
                <MessageCircle size={18} className="text-brand-600" />
                <span>或加微信: <span className="font-bold text-slate-900 select-all">TangYong_Dev</span></span>
              </div>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-3">
              付款后您将获得一个永久激活码 (Code)
            </p>
          </div>

          {/* Activation Form */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="px-2 bg-white text-slate-400">输入激活码</span>
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
                placeholder="例如: VIP-8888"
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
                '解锁'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
