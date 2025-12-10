import React, { useState, useRef } from 'react';
import { Upload, ArrowUp, ArrowDown, Download, AlertTriangle, ShieldCheck, X, FileQuestion, Lock, Zap } from 'lucide-react';
import { PDFFile, FREE_LIMITS } from '../types';
import { mergePDFs, downloadFile } from '../services/pdfService';
import { isProUser, incrementProcessedCount } from '../services/storageService';
import Button from '../components/ui/Button';
import PaywallModal from '../components/PaywallModal';
import SuccessModal from '../components/SuccessModal';

const MergePage: React.FC = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');
  
  // Success Modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastResult, setLastResult] = useState<{data: Uint8Array | Blob, filename: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: PDFFile[] = (Array.from(e.target.files) as File[])
        .filter(f => f.type === 'application/pdf')
        .map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          file,
        }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const newFiles = [...files];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      setFiles(newFiles);
    }
  };

  const calculateTotalSizeMB = () => {
    return files.reduce((acc, curr) => acc + curr.file.size, 0) / (1024 * 1024);
  };

  const handleMerge = async () => {
    const isPro = isProUser();
    const totalSize = calculateTotalSizeMB();
    const fileCount = files.length;

    if (!isPro) {
      if (fileCount > FREE_LIMITS.maxMergeFiles) {
        setPaywallReason(`免费版限制最多合并 ${FREE_LIMITS.maxMergeFiles} 个文件。`);
        setShowPaywall(true);
        return;
      }
      if (totalSize > FREE_LIMITS.maxMergeSizeMB) {
        setPaywallReason(`免费版限制总大小不超过 ${FREE_LIMITS.maxMergeSizeMB}MB。`);
        setShowPaywall(true);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const mergedBytes = await mergePDFs(files.map(f => f.file));
      const filename = `merged_${Date.now()}.pdf`;
      setLastResult({ data: mergedBytes, filename });
      
      // Update stats
      incrementProcessedCount(fileCount);

      setShowSuccess(true);
    } catch (error) {
      console.error(error);
      alert('合并 PDF 失败。请重试。可能文件受损或加密。');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSize = calculateTotalSizeMB().toFixed(1);
  const isOverLimit = !isProUser() && (files.length > FREE_LIMITS.maxMergeFiles || parseFloat(totalSize) > FREE_LIMITS.maxMergeSizeMB);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">合并 PDF 文件</h1>
        <p className="text-slate-600">将多个 PDF 合并为一个文档。快速、安全且完全在本地运行。</p>
        {!isProUser() && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
             <AlertTriangle size={14} />
             免费版限制：{FREE_LIMITS.maxMergeFiles} 个文件 / {FREE_LIMITS.maxMergeSizeMB}MB 大小
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Trust Badge for Upload Area */}
        {files.length === 0 && (
           <div className="absolute top-4 right-4 hidden md:flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 z-10 pointer-events-none">
             <ShieldCheck size={14} /> 本地 WebAssembly 处理
           </div>
        )}

        {/* Drop Zone Visual */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-50 border-b border-slate-200 border-dashed border-b-0 p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors group"
        >
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <p className="font-medium text-slate-900">拖拽 PDF 到此处或点击上传</p>
          <p className="text-sm text-slate-500 mt-1">100% 隐私保护，无文件上传。</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            multiple 
            className="hidden" 
          />
        </div>

        {/* File List */}
        <div className="divide-y divide-slate-100">
          {files.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-sm">
              尚未选择文件。
            </div>
          ) : (
            files.map((file, index) => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 overflow-hidden">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-100 text-pdf-red rounded text-xs font-bold">
                    PDF
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-xs sm:max-w-md">{file.file.name}</p>
                    <p className="text-xs text-slate-500">{(file.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex flex-col mr-2">
                     <button 
                       disabled={index === 0} 
                       onClick={() => moveFile(index, -1)}
                       className="p-1 text-slate-400 hover:text-brand-600 disabled:opacity-20"
                      >
                       <ArrowUp size={14} />
                     </button>
                     <button 
                       disabled={index === files.length - 1} 
                       onClick={() => moveFile(index, 1)}
                       className="p-1 text-slate-400 hover:text-brand-600 disabled:opacity-20"
                      >
                       <ArrowDown size={14} />
                     </button>
                  </div>
                  <button onClick={() => removeFile(file.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-600">
             共计：<span className="font-medium text-slate-900">{files.length}</span> 个文件，<span className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-slate-900'}`}>{totalSize} MB</span>
          </div>
          
          <Button 
            disabled={files.length < 2} 
            onClick={handleMerge}
            isLoading={isProcessing}
            className="w-full sm:w-auto"
          >
            开始合并 <Download size={18} className="ml-2" />
          </Button>
        </div>
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)}
        onSuccess={handleMerge} 
        reason={paywallReason}
      />

      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onDownloadAgain={() => lastResult && downloadFile(lastResult.data, lastResult.filename)}
        onStartOver={() => {
          setShowSuccess(false);
          setFiles([]);
        }}
        fileName={lastResult?.filename || 'merged_files.pdf'}
        message={`成功合并 ${files.length} 个文件！`}
      />

      {/* SEO Content Section */}
      <div className="mt-20 border-t border-slate-200 pt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">关于 PDF 合并的常见问题</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 rounded-lg p-6">
             <div className="flex items-center gap-2 mb-3">
               <ShieldCheck className="text-green-600" size={20} />
               <h3 className="font-bold text-slate-900">使用 LocalPDF 合并文件安全吗？</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed">
               绝对安全！与传统的在线 PDF 工具不同，极速PDF工具箱采用 <span className="font-semibold text-slate-900">WebAssembly 技术</span>，
               所有文件处理都在您的浏览器本地完成。您的文件从未上传到我们的服务器，因此不存在任何数据泄露风险，特别适合处理合同、发票等敏感文档。
             </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
             <div className="flex items-center gap-2 mb-3">
               <Zap className="text-amber-500" size={20} />
               <h3 className="font-bold text-slate-900">为什么选择离线合并？</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed">
               速度快！因为不需要等待文件上传和下载，合并过程几乎是瞬间完成的。即使是 100MB 的大文件，也能在几秒钟内完成合并。
               同时，您不需要担心网络环境，断网也能使用。
             </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
             <div className="flex items-center gap-2 mb-3">
               <Lock className="text-brand-600" size={20} />
               <h3 className="font-bold text-slate-900">免费版有什么限制？</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed">
               极速PDF工具箱的免费版支持合并最多 3 个文件，总大小不超过 10MB。
               如果您需要处理更多文件或大文件，建议升级到 <span className="font-semibold text-slate-900">终身专业版</span>，
               仅需一杯咖啡的价格，即可解锁无限使用权。
             </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
             <div className="flex items-center gap-2 mb-3">
               <FileQuestion className="text-slate-500" size={20} />
               <h3 className="font-bold text-slate-900">如何调整文件顺序？</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed">
               上传文件后，您可以使用列表右侧的“向上”和“向下”箭头来调整 PDF 文件的合并顺序。
               合并后的 PDF 将严格按照列表从上到下的顺序生成。
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergePage;
