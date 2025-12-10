export interface PDFFile {
  id: string;
  file: File;
  previewUrl?: string; // We might skip generating thumbnails for MVP performance
  pageCount?: number;
}

export enum AppRoute {
  HOME = '/',
  MERGE = '/merge',
  SPLIT = '/split',
}

export interface LimitConfig {
  maxMergeFiles: number;
  maxMergeSizeMB: number;
  maxSplitSizeMB: number;
  maxSplitPages: number;
}

export const FREE_LIMITS: LimitConfig = {
  maxMergeFiles: 3,
  maxMergeSizeMB: 10,
  maxSplitSizeMB: 10,
  maxSplitPages: 20,
};

export const VIP_KEY = "LOCAL-PDF-VIP";
export const STORAGE_KEY_LICENSE = "localpdf_license_key";