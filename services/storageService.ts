import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { compressImage } from './imageCompressor';

export interface StorageConfig {
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
}

/**
 * Downloads any file, data URL, blob, or remote asset directly to the user's device
 */
export async function downloadFile(url: string, rawFilename: string = 'file'): Promise<void> {
  try {
    const filename = sanitizeFilename(rawFilename);

    // 1. Data URLs (e.g. base64 PDFs, images)
    if (url.startsWith('data:')) {
      const response = await fetch(url);
      const blob = await response.blob();
      triggerBlobDownload(blob, filename);
      return;
    }

    // 2. Blob URLs
    if (url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 3. Remote URLs (Cloudinary, Google Drive preview, Supabase, etc.)
    try {
      // Attempt CORS fetch for direct silent download
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        triggerBlobDownload(blob, filename);
        return;
      }
    } catch {
      // CORS blocked - fallback to download link or direct open
    }

    // Fallback: If Cloudinary URL, append fl_attachment flag for forced browser download
    let downloadUrl = url;
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    // Ultimate fallback
    window.open(url, '_blank');
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return cleaned || 'download';
}

/**
 * Uploads a file with progress tracking
 * Uses Cloudinary if configured; otherwise uses optimized client-side compression
 */
export async function uploadFileToStorage(
  file: File,
  config?: StorageConfig | null,
  onProgress?: (percent: number) => void
): Promise<{ url: string; type: 'PDF' | 'IMAGE' | 'LINK' | 'file'; size: number; name: string }> {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const fileType: 'PDF' | 'IMAGE' | 'LINK' | 'file' = isPdf ? 'PDF' : isImage ? 'IMAGE' : 'file';

  // 1. If Cloudinary is configured, upload directly to Cloudinary
  if (config?.cloudinaryCloudName && config?.cloudinaryUploadPreset) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/auto/upload`;
      const formData = new FormData();

      formData.append('file', file);
      formData.append('upload_preset', config.cloudinaryUploadPreset);

      xhr.open('POST', endpoint);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              url: data.secure_url || data.url,
              type: fileType,
              size: data.bytes || file.size,
              name: file.name
            });
          } catch (err) {
            reject(new Error('فشل قراءة استجابة خادم التخزين السحابي'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error?.message || `خطأ في رفع الملف (${xhr.status})`));
          } catch {
            reject(new Error(`فشل رفع الملف (${xhr.status}). تأكد من إعدادات Cloudinary`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('فشل الاتصال بخادم التخزين السحابي. تحقق من اتصال الإنترنت.'));
      };

      xhr.send(formData);
    });
  }

  // 2. Direct local client-side processing (No Cloudinary)
  if (isImage) {
    if (onProgress) onProgress(30);
    const compressed = await compressImage(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.8,
      format: 'image/jpeg'
    });
    if (onProgress) onProgress(100);
    return {
      url: compressed,
      type: 'IMAGE',
      size: file.size,
      name: file.name
    };
  }

  // For PDFs and docs without Cloudinary
  if (file.size > 900 * 1024) {
    throw new Error(
      `حجم الملف (${(file.size / (1024 * 1024)).toFixed(1)}MB) يتجاوز حد التخزين المباشر (900KB).\nيرجى تفعيل مساحة Cloudinary السحابية المجانية (25GB) من إعدادات التخزين، أو مشاركة رابط Google Drive للملفات الكبيرة.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (onProgress) onProgress(20);
    reader.onload = (ev) => {
      if (onProgress) onProgress(100);
      resolve({
        url: ev.target?.result as string,
        type: fileType,
        size: file.size,
        name: file.name
      });
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف من الجهاز'));
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch storage config from Firestore
 */
export async function getStorageConfig(): Promise<StorageConfig | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'storage_config'));
    if (snap.exists()) {
      return snap.data() as StorageConfig;
    }
  } catch (error) {
    console.error('Error fetching storage config:', error);
  }
  return null;
}

/**
 * Save storage config to Firestore
 */
export async function saveStorageConfig(config: StorageConfig): Promise<void> {
  await setDoc(doc(db, 'settings', 'storage_config'), config, { merge: true });
}
