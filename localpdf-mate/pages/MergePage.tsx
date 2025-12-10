import React, { useState, useRef } from 'react';
import { Upload, FileText, X, ArrowUp, ArrowDown, Download, AlertTriangle, ShieldCheck } from 'lucide-react';
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
        setPaywallReason(`Free version is limited to ${FREE_LIMITS.maxMergeFiles} files.`);
        setShowPaywall(true);
        return;
      }
      if (totalSize > FREE_LIMITS.maxMergeSizeMB) {
        setPaywallReason(`Free version is limited to ${FREE_LIMITS.maxMergeSizeMB}MB total size.`);
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

      // Removed auto-download to let user download from Success Modal
      // downloadFile(mergedBytes, filename); 
      setShowSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSize = calculateTotalSizeMB().toFixed(1);
  const isOverLimit = !isProUser() && (files.length > FREE_LIMITS.maxMergeFiles || parseFloat(totalSize) > FREE_LIMITS.maxMergeSizeMB);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Merge PDF Files</h1>
        <p className="text-slate-600">Combine multiple PDFs into one unified document. Fast, secure, and local.</p>
        {!isProUser() && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
             <AlertTriangle size={14} />
             Free Limit: {FREE_LIMITS.maxMergeFiles} files / {FREE_LIMITS.maxMergeSizeMB}MB max
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Trust Badge for Upload Area */}
        {files.length === 0 && (
           <div className="absolute top-4 right-4 hidden md:flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 z-10 pointer-events-none">
             <ShieldCheck size={14} /> Processed locally via WebAssembly
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
          <p className="font-medium text-slate-900">Drop PDFs here or click to upload</p>
          <p className="text-sm text-slate-500 mt-1">100% Private. No file upload.</p>
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
              No files selected yet.
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
             Total: <span className="font-medium text-slate-900">{files.length}</span> files, <span className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-slate-900'}`}>{totalSize} MB</span>
          </div>
          
          <Button 
            disabled={files.length < 2} 
            onClick={handleMerge}
            isLoading={isProcessing}
            className="w-full sm:w-auto"
          >
            Merge Files <Download size={18} className="ml-2" />
          </Button>
        </div>
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)}
        onSuccess={handleMerge} // Retry merge on success
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
        message={`Successfully merged ${files.length} files!`}
      />
    </div>
  );
};

export default MergePage;
