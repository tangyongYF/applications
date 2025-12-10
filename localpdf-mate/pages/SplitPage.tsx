import React, { useState, useRef } from 'react';
import { Upload, FileText, Eye, Split, Layers, AlertTriangle, ShieldCheck, Zap, Lock, FileQuestion } from 'lucide-react';
import { PDFFile, FREE_LIMITS } from '../types';
import { splitPDF, downloadFile, getPageCount, parsePageRange } from '../services/pdfService';
import { isProUser, incrementProcessedCount } from '../services/storageService';
import Button from '../components/ui/Button';
import PaywallModal from '../components/PaywallModal';
import SuccessModal from '../components/SuccessModal';

const SplitPage: React.FC = () => {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [mode, setMode] = useState<'range' | 'extract_all'>('range');
  const [rangeStr, setRangeStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');
  
  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastResult, setLastResult] = useState<{data: Uint8Array | Blob, filename: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') return;

      try {
        const count = await getPageCount(selectedFile);
        if (count === 0) throw new Error("Could not read PDF pages");

        setFile({
          id: Math.random().toString(36),
          file: selectedFile,
        });
        setPageCount(count);
        setRangeStr(`1-${Math.min(count, 5)}`); // Default suggestion
      } catch (e: any) {
        alert(e.message || "加载 PDF 失败");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreview = () => {
    if (file) {
      const url = URL.createObjectURL(file.file);
      window.open(url, '_blank');
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    const isPro = isProUser();
    const sizeMB = file.file.size / (1024 * 1024);

    if (!isPro) {
      if (sizeMB > FREE_LIMITS.maxSplitSizeMB) {
        setPaywallReason(`免费版限制文件大小不超过 ${FREE_LIMITS.maxSplitSizeMB}MB。`);
        setShowPaywall(true);
        return;
      }
      if (pageCount > FREE_LIMITS.maxSplitPages) {
        setPaywallReason(`免费版限制页数不超过 ${FREE_LIMITS.maxSplitPages} 页。`);
        setShowPaywall(true);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const result = await splitPDF(file.file, mode, rangeStr);
      setLastResult({ data: result.data, filename: result.filename });
      
      // Update stats
      incrementProcessedCount(1);
      
      setShowSuccess(true);
    } catch (error) {
      console.error(error);
      alert('拆分 PDF 失败。请检查页码格式。');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to sync Visual Grid clicks with Input String
  const togglePage = (pageNum: number) => {
    // Current parsed pages
    const currentPages = new Set(parsePageRange(rangeStr, pageCount));
    
    if (currentPages.has(pageNum)) {
      currentPages.delete(pageNum);
    } else {
      currentPages.add(pageNum);
    }
    
    // Convert Set back to sorted array
    const sorted = Array.from(currentPages).sort((a, b) => a - b);
    
    // Convert to range string (e.g. 1-3, 5)
    if (sorted.length === 0) {
      setRangeStr("");
      return;
    }

    let result = "";
    let rangeStart = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        result += (rangeStart === prev) ? `${rangeStart + 1}, ` : `${rangeStart + 1}-${prev + 1}, `;
        rangeStart = curr;
        prev = curr;
      }
    }
    result += (rangeStart === prev) ? `${rangeStart + 1}` : `${rangeStart + 1}-${prev + 1}`;
    setRangeStr(result);
  };

  const getSelectedSet = () => new Set(parsePageRange(rangeStr, pageCount));
  const selectedSet = getSelectedSet();
  const isOverLimit = !isProUser() && file && (
    (file.file.size / (1024 * 1024)) > FREE_LIMITS.maxSplitSizeMB || 
    pageCount > FREE_LIMITS.maxSplitPages
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">拆分 PDF 文件</h1>
        <p className="text-slate-600">提取指定页面或将每页拆分为单独文件。</p>
        {!isProUser() && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
             <AlertTriangle size={14} />
             免费版限制：{FREE_LIMITS.maxSplitSizeMB}MB 大小 / {FREE_LIMITS.maxSplitPages} 页
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Trust Badge for Upload Area */}
        {!file && (
           <div className="absolute top-4 right-4 hidden md:flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 z-10 pointer-events-none">
             <ShieldCheck size={14} /> 本地 WebAssembly 处理
           </div>
        )}

        {/* Upload Area */}
        {!file ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group relative"
          >
            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <p className="font-medium text-slate-900">选择要拆分的 PDF</p>
            <p className="text-sm text-slate-500 mt-2">100% 隐私保护，无文件上传。</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="application/pdf" 
              className="hidden" 
            />
          </div>
        ) : (
          <div>
            {/* File Info Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full">
                <div className="w-10 h-10 bg-red-100 text-pdf-red rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-900 truncate">{file.file.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{(file.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>•</span>
                    <span className={isOverLimit ? "text-red-600 font-bold" : ""}>{pageCount} 页</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="secondary" onClick={handlePreview} className="flex-1 sm:flex-none text-xs">
                  <Eye size={16} className="mr-1.5" /> 预览
                </Button>
                <Button variant="ghost" onClick={() => setFile(null)} className="flex-1 sm:flex-none text-xs">更换文件</Button>
              </div>
            </div>

            {/* Split Options */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setMode('range')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'range' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className={`mb-2 ${mode === 'range' ? 'text-brand-600' : 'text-slate-400'}`}>
                    <Split size={24} />
                  </div>
                  <div className="font-bold text-slate-900">提取页面</div>
                  <div className="text-sm text-slate-500 mt-1">选择特定页面保存为新 PDF。</div>
                </button>

                <button 
                  onClick={() => setMode('extract_all')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'extract_all' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className={`mb-2 ${mode === 'extract_all' ? 'text-brand-600' : 'text-slate-400'}`}>
                    <Layers size={24} />
                  </div>
                  <div className="font-bold text-slate-900">拆分所有页面</div>
                  <div className="text-sm text-slate-500 mt-1">将每一页保存为单独的 PDF (ZIP)。</div>
                </button>
              </div>

              {mode === 'range' && (
                <div className="mb-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">页面选择</label>
                    <input 
                      type="text" 
                      value={rangeStr}
                      onChange={(e) => setRangeStr(e.target.value)}
                      placeholder="例如 1-5, 8, 11-13"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">手动输入页码或点击下方网格选择。</p>
                  </div>
                  
                  {/* Visual Page Selector */}
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">快速选择</div>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {Array.from({ length: Math.min(pageCount, 100) }, (_, i) => i + 1).map((num) => {
                        const isSelected = selectedSet.has(num - 1); // logic uses 0-based
                        return (
                          <button
                            key={num}
                            onClick={() => togglePage(num - 1)}
                            className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                              isSelected 
                                ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-200' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:bg-brand-50'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                      {pageCount > 100 && (
                        <div className="w-full text-center py-2 text-xs text-slate-400 italic">
                          仅显示前 100 页。更多页面请直接输入。
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSplit}
                disabled={mode === 'range' && !rangeStr}
                isLoading={isProcessing}
                className="w-full py-4 text-lg"
              >
                {mode === 'range' ? '下载提取后的 PDF' : '下载 ZIP 压缩包'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)}
        onSuccess={handleSplit}
        reason={paywallReason}
      />

      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onDownloadAgain={() => lastResult && downloadFile(lastResult.data, lastResult.filename)}
        onStartOver={() => {
          setShowSuccess(false);
          setFile(null);
          setRangeStr('');
        }}
        fileName={lastResult?.filename || 'processed_file.pdf'}
      />

      {/* SEO Content Section */}
      <div className="mt-20 border-t border-slate-200 pt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">PDF 拆分常见问题 (FAQ)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 rounded-lg p-6">
             <div className="flex items-center gap-2 mb-3">
               <ShieldCheck className="text-green-600" size={20} />
               <h3 className="font-bold text-slate-900">我的文件会被上传吗？</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed">
               完全不会！极速PDF工具箱是真正的<span className="font-semibold text-slate-900">离线拆分工具</span>。
               我们利用先进的浏览器技术，在您自己的电脑上完成所有分割操作。文件不经过网络传输，确保隐私绝对安全。
             </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
             <div className="flex items-center gap-2 mb-3">
               <Split className="text-brand-600" size={20} />
               <h3 className="font-bold text-slate-900">可以提取哪些页面？</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed">
               非常灵活！您可以输入任何页码组合。比如输入 "1, 3-5, 10" 将会提取第1页、第3到5页以及第10页，并将它们合并成一个新的 PDF 文件下载。
             </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
             <div className="flex items-center gap-2 mb-3">
               <Layers className="text-amber-500" size={20} />
               <h3 className="font-bold text-slate-900">什么是“拆分所有页面”？</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed">
               如果您有一个 50 页的文档，想要把这 50 页全部变成单独的文件，选择这个模式即可。
               我们会自动将它们打包成一个 ZIP 压缩包供您下载，无需手动一页页保存。
             </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-6">
             <div className="flex items-center gap-2 mb-3">
               <Lock className="text-slate-500" size={20} />
               <h3 className="font-bold text-slate-900">为什么显示“受密码保护”？</h3>
             </div>
             <p className="text-sm text-slate-600 leading-relaxed">
               如果您的 PDF 文件本身设置了打开密码，为了安全起见，我们无法在不输入密码的情况下进行拆分。
               请先使用其他工具移除密码，或确认您拥有该文件的编辑权限。
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPage;
