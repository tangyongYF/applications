// STORAGE KEYS
const STORAGE_KEY_LICENSE_DATA = "localpdf_license_data";
const STORAGE_KEY_STATS = "localpdf_stats_count";

interface LicenseData {
  key: string;
  activatedAt: string;
  expiresAt: string;
}

export const isProUser = (): boolean => {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY_LICENSE_DATA);
    if (!dataStr) return false;

    const data: LicenseData = JSON.parse(dataStr);
    
    // 检查是否过期
    const expiryDate = new Date(data.expiresAt);
    const now = new Date();

    if (now > expiryDate) {
      // 如果过期，静默移除（或者可以保留状态并在UI提示过期）
      // 这里为了简单，如果过期就视为非Pro
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
};

export const activateLicense = (key: string, expiresAt: string): boolean => {
  try {
    const data: LicenseData = {
      key,
      activatedAt: new Date().toISOString(),
      expiresAt: expiresAt
    };
    localStorage.setItem(STORAGE_KEY_LICENSE_DATA, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Failed to save license", e);
    return false;
  }
};

export const removeLicense = (): void => {
  localStorage.removeItem(STORAGE_KEY_LICENSE_DATA);
};

export const getExpirationDate = (): string | null => {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY_LICENSE_DATA);
    if (!dataStr) return null;
    const data: LicenseData = JSON.parse(dataStr);
    return new Date(data.expiresAt).toLocaleDateString();
  } catch (e) {
    return null;
  }
};

export const getProcessedCount = (): number => {
  return parseInt(localStorage.getItem(STORAGE_KEY_STATS) || '0', 10);
};

export const incrementProcessedCount = (count: number = 1): void => {
  const current = getProcessedCount();
  localStorage.setItem(STORAGE_KEY_STATS, (current + count).toString());
  window.dispatchEvent(new Event('localpdf_stats_updated'));
};