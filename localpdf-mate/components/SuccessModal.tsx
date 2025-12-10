import React from 'react';
import { Download, RefreshCw, CheckCircle, Lock } from 'lucide-react';
import Button from './ui/Button';
import { isProUser } from '../services/storageService';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadAgain: () => void;
  onStartOver: () => void;
  fileName: string;
  message?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  onDownloadAgain, 
  onStartOver,
  fileName,
  message = "您的文件已准备就绪！"
}) => {
  if (!isOpen) return null;
  
  const isPro = isProUser();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="bg-green-50 p-6 flex flex-col items-center justify-center text-center border-b border-green-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">处理成功！</h2>
          <p className="text-slate-600 mt-1">{message}</p>
          <p className="text-xs text-slate-400 mt-2 font-mono bg-white px-2 py-1 rounded border border-slate-100 truncate max-w-full">
            {fileName}
          </p>
        </div>

        <div className="p-6 space-y-3">
          <Button onClick={onDownloadAgain} className="w-full justify-center" variant="primary">
            <Download size={18} className="mr-2" /> 下载文件
          </Button>
          
          <Button onClick={onStartOver} className="w-full justify-center" variant="secondary">
            <RefreshCw size={18} className="mr-2" /> 处理其他文件
          </Button>

          {!isPro && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 mb-2">喜欢 LocalPDF Mate？</p>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-brand-600 flex items-center justify-center gap-1 hover:underline">
                <Lock size={12} /> ¥19.9 解锁无限使用权
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
