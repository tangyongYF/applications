import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Files, Scissors, ShieldCheck, WifiOff, Minimize2, Lock } from 'lucide-react';
import { isProUser, removeLicense, getProcessedCount } from '../services/storageService';
import PaywallModal from './PaywallModal';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isPro = isProUser();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [processedCount, setProcessedCount] = useState(getProcessedCount());
  
  // Ghost Feature State
  const [showCompressPaywall, setShowCompressPaywall] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleStatsUpdate = () => setProcessedCount(getProcessedCount());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('localpdf_stats_updated', handleStatsUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('localpdf_stats_updated', handleStatsUpdate);
    };
  }, []);

  // Simple hard refresh to clear pro state for demo purposes if needed
  const handleLogout = () => {
    if(confirm("确定要移除 Pro 授权吗？")) {
      removeLicense();
      window.location.reload();
    }
  }

  const handleCompressClick = () => {
    if (isPro) {
      alert("🚀 Pro 功能预告：高效压缩功能将在下周推出！敬请期待。");
    } else {
      setShowCompressPaywall(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                  <ShieldCheck size={20} />
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight">极速PDF工具箱</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <NavLink 
                  to="/merge"
                  className={({ isActive }) => 
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive 
                        ? 'border-brand-500 text-slate-900' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`
                  }
                >
                  <Files size={18} className="mr-2" /> 合并
                </NavLink>
                <NavLink 
                  to="/split"
                  className={({ isActive }) => 
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive 
                        ? 'border-brand-500 text-slate-900' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`
                  }
                >
                  <Scissors size={18} className="mr-2" /> 拆分
                </NavLink>
                
                {/* Ghost Feature Button */}
                <button
                  onClick={handleCompressClick}
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
                >
                  <Minimize2 size={18} className="mr-2" /> 压缩 
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    PRO
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPro ? (
                 <span onClick={handleLogout} className="cursor-pointer inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                   专业版已激活
                 </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  免费版
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="sm:hidden bg-white border-b border-slate-200 flex justify-around py-2">
         <NavLink to="/merge" className={({isActive}) => `flex flex-col items-center p-2 text-xs ${isActive ? 'text-brand-600' : 'text-slate-500'}`}>
            <Files size={20} /> <span className="mt-1">合并</span>
         </NavLink>
         <NavLink to="/split" className={({isActive}) => `flex flex-col items-center p-2 text-xs ${isActive ? 'text-brand-600' : 'text-slate-500'}`}>
            <Scissors size={20} /> <span className="mt-1">拆分</span>
         </NavLink>
         <button onClick={handleCompressClick} className="flex flex-col items-center p-2 text-xs text-slate-500">
            <Minimize2 size={20} /> <span className="mt-1">压缩</span>
         </button>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-500">
               <p>© 2024 极速PDF工具箱 (LocalPDF).</p>
               {/* Personal Stats */}
               <p className="hidden sm:block text-slate-300">|</p>
               <p>您已本地处理了 <span className="font-bold text-slate-900">{processedCount}</span> 个文件。</p>
             </div>
             <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <ShieldCheck size={14} className="text-green-600" />
                <span className="font-medium">隐私声明：</span> 无数据上传服务器。所有处理均在本地完成。
             </div>
          </div>
        </div>
      </footer>

      {/* Offline Trust Toast */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-green-50 border border-green-200 shadow-lg rounded-lg p-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full text-green-600">
              <WifiOff size={20} />
            </div>
            <div>
              <h4 className="font-bold text-green-800 text-sm">您处于离线状态</h4>
              <p className="text-green-700 text-xs mt-1">
                应用可完美运行！这有力证明了我们不会上传您的文件。您的数据从未离开此设备。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ghost Feature Paywall */}
      <PaywallModal 
        isOpen={showCompressPaywall}
        onClose={() => setShowCompressPaywall(false)}
        onSuccess={() => setShowCompressPaywall(false)}
        reason="PDF 压缩是 Pro 功能，将在下个版本更新。"
      />
    </div>
  );
};

export default Layout;
