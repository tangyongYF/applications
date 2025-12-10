import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export const getPageCount = async (file: File): Promise<number> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Load without parsing all data for speed if possible, but pdf-lib loads mostly everything
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch (error: any) {
    console.error("Error reading PDF page count", error);
    if (error.message && error.message.includes('Password')) {
      throw new Error("This PDF is password protected. Please remove the password first.");
    }
    return 0;
  }
};

export const mergePDFs = async (files: File[]): Promise<Uint8Array> => {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (e) {
      console.error("Failed to load one of the PDFs", e);
      throw new Error(`Failed to load file: ${file.name}. It might be encrypted or corrupted.`);
    }
  }

  return await mergedPdf.save();
};

// Helper to parse "1, 3-5, 10" into [0, 2, 3, 4, 9] (0-based indices)
// UPDATED: Exported for UI use.
export const parsePageRange = (range: string, totalPages: number): number[] => {
  // Normalize: Replace Chinese full-width comma with standard comma
  const normalized = range.replace(/，/g, ',');
  const parts = normalized.split(',');
  const indices: number[] = [];

  parts.forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;

    if (trimmed.includes('-')) {
      const rangeParts = trimmed.split('-').map(s => s.trim());
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0], 10);
        const end = parseInt(rangeParts[1], 10);
        
        if (!isNaN(start) && !isNaN(end)) {
          if (start <= end) {
            // Standard ascending range (e.g., 1-5)
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= totalPages) indices.push(i - 1);
            }
          } else {
            // Reverse range (e.g., 5-1)
            for (let i = start; i >= end; i--) {
              if (i >= 1 && i <= totalPages) indices.push(i - 1);
            }
          }
        }
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        indices.push(page - 1);
      }
    }
  });

  return indices;
};

export const splitPDF = async (
  file: File, 
  mode: 'range' | 'extract_all', 
  rangeString: string
): Promise<{ data: Uint8Array | Blob, isZip: boolean, filename: string }> => {
  
  const arrayBuffer = await file.arrayBuffer();
  let srcDoc;
  try {
    srcDoc = await PDFDocument.load(arrayBuffer);
  } catch (e) {
     throw new Error("Unable to load PDF. It might be password protected.");
  }
  
  const totalPages = srcDoc.getPageCount();

  if (mode === 'range') {
    // Extract specific pages into ONE new PDF
    // Now preserves user's exact order and count
    const indicesToKeep = parsePageRange(rangeString, totalPages);
    
    if (indicesToKeep.length === 0) {
      throw new Error("No valid pages selected. Please check your page range.");
    }

    const newDoc = await PDFDocument.create();
    
    // copyPages accepts an array of indices. 
    // It creates a NEW page object for each index in the array.
    // This correctly handles duplicates (e.g. [0, 0] copies page 0 twice).
    const copiedPages = await newDoc.copyPages(srcDoc, indicesToKeep);
    copiedPages.forEach(page => newDoc.addPage(page));

    const pdfBytes = await newDoc.save();
    return { 
      data: pdfBytes, 
      isZip: false, 
      filename: `extracted_pages.pdf` 
    };
  } else {
    // Extract EVERY page as a separate PDF and zip them
    const zip = new JSZip();
    
    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const pdfBytes = await newDoc.save();
      
      // Pad filenames with zeros (page_001.pdf) for correct sorting in OS file explorers
      const paddedNum = (i + 1).toString().padStart(Math.max(3, totalPages.toString().length), '0');
      zip.file(`page_${paddedNum}.pdf`, pdfBytes);
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    return {
      data: zipContent,
      isZip: true,
      filename: `split_all_pages.zip`
    };
  }
};

export const downloadFile = (data: Uint8Array | Blob, filename: string) => {
  // Fix: Cast data to 'any' to avoid strict TypeScript check on Uint8Array vs BlobPart
  const blob = data instanceof Blob ? data : new Blob([data as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
