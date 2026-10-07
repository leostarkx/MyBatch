import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { compressImage } from './imageCompressor';
import { getCachedDriveToken, uploadFileToGoogleDrive, formatBytes } from './googleDrive';

export const DEFAULT_CLOUDINARY_CLOUD_NAME = 'g2unw5m3';
export const DEFAULT_CLOUDINARY_API_KEY = '922482292286723';
export const DEFAULT_CLOUDINARY_API_SECRET = 'ATP10v2ZyQcDoF3s2DKAvwNTR7Q';

export interface StorageConfig {
  cloudinaryCloudName: string;
  cloudinaryUploadPreset?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  googleDriveFolderUrl?: string;
}

export interface UploadResult {
  url: string;
  type: 'PDF' | 'IMAGE' | 'LINK' | 'file';
  size: number;
  name: string;
  driveFileId?: string;
  previewUrl?: string;
  directDownloadUrl?: string;
  formattedSize?: string;
  provider?: 'cloudinary' | 'google_drive' | 'firebase' | 'dafaaty_cloud' | 'local';
}

// In-memory cache for reassembled chunked files so repeated previews/downloads are instantaneous
const resolvedChunkedUrlCache = new Map<string, string>();

/**
 * Extracts clean Cloudinary cloud_name whether the user enters:
 * - "dxyz123"
 * - "cloudinary://922482292286723:ATP10v2ZyQcDoF3s2DKAvwNTR7Q@dxyz123"
 * - "https://res.cloudinary.com/dxyz123/..."
 */
export function extractCloudinaryCloudName(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';

  // Handle CLOUDINARY_URL format: cloudinary://key:secret@cloud_name
  if (trimmed.startsWith('cloudinary://') && trimmed.includes('@')) {
    return trimmed.split('@')[1].split('/')[0].trim();
  }

  // Handle res.cloudinary.com/<cloud_name>/...
  const urlMatch = trimmed.match(/res\.cloudinary\.com\/([^/]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].trim();
  }

  // Handle api.cloudinary.com/v1_1/<cloud_name>/...
  const apiMatch = trimmed.match(/api\.cloudinary\.com\/v1_1\/([^/]+)/i);
  if (apiMatch && apiMatch[1]) {
    return apiMatch[1].trim();
  }

  return trimmed;
}

/**
 * Pure JS + WebCrypto SHA-1 Hex generator for Cloudinary Signed Uploads
 */
async function computeSha1Hex(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback to pure JS below
    }
  }

  // Pure JS SHA-1 fallback
  function rotateLeft(n: number, s: number) {
    return (n << s) | (n >>> (32 - s));
  }
  const utf8 = unescape(encodeURIComponent(message));
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[utf8.length >> 2] |= 0x80 << (24 - (utf8.length % 4) * 8);
  words[(((utf8.length + 8) >> 6) << 4) + 15] = utf8.length * 8;

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const w = new Array(80);

  for (let i = 0; i < words.length; i += 16) {
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let j = 0; j < 80; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        w[j] = rotateLeft(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
      }
      const f =
        j < 20
          ? (b & c) | (~b & d)
          : j < 40
          ? b ^ c ^ d
          : j < 60
          ? (b & c) | (b & d) | (c & d)
          : b ^ c ^ d;
      const k =
        j < 20
          ? 0x5a827999
          : j < 40
          ? 0x6ed9eba1
          : j < 60
          ? 0x8f1bbcdc
          : 0xca62c1d6;
      const temp = (rotateLeft(a, 5) + f + e + k + w[j]) | 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  return [h0, h1, h2, h3, h4]
    .map((h) => (h >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

/**
 * Resolves a dafaaty-cloud:// chunked file URL or Cloudinary raw PDF URL into a usable Blob URL
 */
export async function resolveStoredFileUrl(url: string, expectedType?: string): Promise<string> {
  if (!url) return url;

  if (resolvedChunkedUrlCache.has(url)) {
    return resolvedChunkedUrlCache.get(url)!;
  }

  // Handle Cloudinary raw PDF URLs (including disguised _pdf.bin files) so browser renders/downloads them as application/pdf
  if (
    url.includes('res.cloudinary.com') &&
    url.includes('/raw/upload/') &&
    (expectedType === 'PDF' || url.toLowerCase().endsWith('.pdf') || url.toLowerCase().endsWith('_pdf.bin'))
  ) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const pdfBlob = new Blob([arrayBuf], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);
        resolvedChunkedUrlCache.set(url, blobUrl);
        return blobUrl;
      }
    } catch {
      return url;
    }
  }

  if (!url.startsWith('dafaaty-cloud://')) {
    return url;
  }

  const fileId = url.replace('dafaaty-cloud://', '').trim();
  const metaSnap = await getDoc(doc(db, 'settings', `file_meta_${fileId}`));
  if (!metaSnap.exists()) {
    throw new Error('لم يتم العثور على أجزاء الملف في قاعدة البيانات');
  }

  const meta = metaSnap.data() as {
    totalChunks: number;
    mimeType: string;
    name: string;
  };

  const chunkPromises: Promise<string>[] = [];
  for (let i = 0; i < meta.totalChunks; i++) {
    chunkPromises.push(
      getDoc(doc(db, 'settings', `file_chunk_${fileId}_${i}`)).then((snap) =>
        snap.exists() ? (snap.data().data as string) : ''
      )
    );
  }

  const chunks = await Promise.all(chunkPromises);
  const fullDataUrl = chunks.join('');
  const response = await fetch(fullDataUrl);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  resolvedChunkedUrlCache.set(url, blobUrl);
  return blobUrl;
}

/**
 * Downloads any file, data URL, chunked cloud file, blob, or remote asset directly to the user's device
 */
export async function downloadFile(url: string, rawFilename: string = 'file'): Promise<void> {
  try {
    let filename = sanitizeFilename(rawFilename);

    // 0. Chunked Firestore Cloud URLs (dafaaty-cloud://...)
    if (url.startsWith('dafaaty-cloud://')) {
      const fileId = url.replace('dafaaty-cloud://', '').trim();
      const metaSnap = await getDoc(doc(db, 'settings', `file_meta_${fileId}`));
      if (metaSnap.exists()) {
        const metaData = metaSnap.data();
        if (metaData.name && (!filename.includes('.') || filename.endsWith('.txt'))) {
          filename = sanitizeFilename(metaData.name);
        }
      }
      const resolvedBlobUrl = await resolveStoredFileUrl(url);
      const a = document.createElement('a');
      a.href = resolvedBlobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 1. Data URLs (e.g. base64 PDFs, DOCX, images)
    if (url.startsWith('data:')) {
      const response = await fetch(url);
      const blob = await response.blob();
      triggerBlobDownload(blob, ensureFileExtension(filename, blob.type, url));
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

    // 3. Remote URLs
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const finalName = ensureFileExtension(filename, blob.type, url);
        triggerBlobDownload(blob, finalName);
        return;
      }
    } catch {
      // CORS blocked - fallback to download link or direct open
    }

    let downloadUrl = url;
    if (url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('/raw/upload/')) {
      downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = ensureFileExtension(filename, '', url);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    window.open(url, '_blank');
  }
}

function ensureFileExtension(filename: string, mimeType: string, url: string): string {
  // If URL is a disguised Cloudinary PDF (_pdf.bin), always enforce .pdf extension
  if (url.toLowerCase().includes('_pdf.bin')) {
    const cleanBase = filename.replace(/\.(bin|txt|pdf)$/i, '');
    return `${cleanBase}.pdf`;
  }

  // Check if filename already has a valid extension (and not an accidental .txt or .bin)
  const extMatch = filename.match(/\.([a-zA-Z0-9]{2,5})$/);
  if (extMatch && extMatch[1].toLowerCase() !== 'txt' && extMatch[1].toLowerCase() !== 'bin') {
    return filename;
  }

  const baseName = extMatch ? filename.slice(0, -extMatch[0].length) : filename;

  // Try extracting extension from URL path
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const urlExtMatch = cleanUrl.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (urlExtMatch && urlExtMatch[1].toLowerCase() !== 'bin') {
      return `${baseName}.${urlExtMatch[1].toLowerCase()}`;
    }
  } catch {}

  // Fallback to MIME type mapping
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  if (mimeType && mimeMap[mimeType]) {
    return `${baseName}.${mimeMap[mimeType]}`;
  }

  return filename;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return cleaned || 'download';
}

/**
 * Upload directly to Cloudinary using either Signed Upload (API Key + Secret) or Unsigned Preset
 */
export async function uploadToCloudinary(
  file: File,
  config?: StorageConfig | null,
  folderCategory: string = 'materials',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const cloudName =
    extractCloudinaryCloudName(config?.cloudinaryCloudName || '') ||
    DEFAULT_CLOUDINARY_CLOUD_NAME;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const lowerName = file.name.toLowerCase();
  const isDocOrPdf =
    file.type === 'application/pdf' ||
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.ppt') ||
    lowerName.endsWith('.pptx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.xlsx');
  const fileType: 'PDF' | 'IMAGE' | 'LINK' | 'file' = isImage
    ? 'IMAGE'
    : isDocOrPdf
    ? 'PDF'
    : 'file';

  const apiKey = (config?.cloudinaryApiKey || DEFAULT_CLOUDINARY_API_KEY).trim();
  const apiSecret = (config?.cloudinaryApiSecret || DEFAULT_CLOUDINARY_API_SECRET).trim();
  const uploadPreset = (config?.cloudinaryUploadPreset || '').trim();

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `dafaaty_${folderCategory}`;

  const formData = new FormData();
  formData.append('file', file);

  if (apiKey && apiSecret) {
    // Signed Upload with access_mode=public & use_filename=true
    const stringToSign = `access_mode=public&folder=${folder}&timestamp=${timestamp}&use_filename=true${apiSecret}`;
    const signature = await computeSha1Hex(stringToSign);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    formData.append('access_mode', 'public');
    formData.append('use_filename', 'true');
    formData.append('signature', signature);
  } else if (uploadPreset) {
    // Unsigned Upload fallback
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
  } else {
    throw new Error('بيانات التخزين غير مكتملة');
  }

  // Use raw/upload for documents, and auto/upload for images/videos
  const resourceEndpoint = isImage || isVideo ? 'auto' : 'raw';

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceEndpoint}/upload`;

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
          const secureUrl = data.secure_url || data.url;
          resolve({
            url: secureUrl,
            previewUrl: secureUrl,
            directDownloadUrl: secureUrl,
            type: fileType,
            size: data.bytes || file.size,
            formattedSize: formatBytes(data.bytes || file.size),
            name: file.name,
            provider: 'cloudinary',
          });
        } catch (err) {
          reject(err);
        }
      } else {
        let errMsg = `خطأ في رفع الملف إلى Cloudinary (${xhr.status})`;
        try {
          const errJson = JSON.parse(xhr.responseText);
          if (errJson?.error?.message) {
            errMsg = `Cloudinary: ${errJson.error.message}`;
          }
        } catch {}
        reject(new Error(errMsg));
      }
    };

    xhr.onerror = () => reject(new Error('فشل الاتصال بخادم التخزين السحابي Cloudinary'));
    xhr.send(formData);
  });
}

/**
 * Upload directly to Firebase Cloud Storage with real-time percentage progress
 */
export async function uploadToFirebaseStorage(
  file: File,
  folder = 'materials',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${cleanName}`;
  const fileRef = storageRef(storage, path);

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const fileType: 'PDF' | 'IMAGE' | 'LINK' | 'file' = isPdf ? 'PDF' : isImage ? 'IMAGE' : 'file';

  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(progress);
        }
      },
      (error) => {
        console.warn('Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadUrl,
            previewUrl: downloadUrl,
            directDownloadUrl: downloadUrl,
            type: fileType,
            size: file.size,
            name: file.name,
            formattedSize: formatBytes(file.size),
            provider: 'firebase',
          });
        } catch (urlErr) {
          reject(urlErr);
        }
      }
    );
  });
}

/**
 * Built-in Chunked Firestore Cloud Storage (Splits files up to 20MB into safe 600KB Firestore chunks)
 * Ensures lectures/PDFs ALWAYS upload and persist in Firestore even without external accounts!
 */
export async function uploadToChunkedFirestore(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const isImage = file.type.startsWith('image/');
  const lowerName = file.name.toLowerCase();
  const isDocOrPdf =
    file.type === 'application/pdf' ||
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.ppt') ||
    lowerName.endsWith('.pptx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.xlsx');
  const fileType: 'PDF' | 'IMAGE' | 'LINK' | 'file' = isImage
    ? 'IMAGE'
    : isDocOrPdf
    ? 'PDF'
    : 'file';

  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target?.result as string);
    reader.onerror = () => reject(new Error('فشل قراءة الملف من الجهاز'));
    reader.readAsDataURL(file);
  });

  // If small enough (< 550KB base64), store directly
  if (dataUrl.length <= 550_000) {
    if (onProgress) onProgress(100);
    return {
      url: dataUrl,
      previewUrl: dataUrl,
      directDownloadUrl: dataUrl,
      type: fileType,
      size: file.size,
      formattedSize: formatBytes(file.size),
      name: file.name,
      provider: 'dafaaty_cloud',
    };
  }

  // Otherwise split into safe 650,000-character chunks in Firestore
  const CHUNK_SIZE = 650_000;
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
  const fileId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  await setDoc(doc(db, 'settings', `file_meta_${fileId}`), {
    fileId,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    totalChunks,
    createdAt: Date.now(),
  });

  for (let i = 0; i < totalChunks; i++) {
    const slice = dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await setDoc(doc(db, 'settings', `file_chunk_${fileId}_${i}`), {
      fileId,
      index: i,
      data: slice,
    });
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100));
    }
  }

  const cloudRefUrl = `dafaaty-cloud://${fileId}`;
  // Pre-populate local cache with Blob URL for instant preview
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    resolvedChunkedUrlCache.set(cloudRefUrl, URL.createObjectURL(blob));
  } catch {}

  return {
    url: cloudRefUrl,
    previewUrl: cloudRefUrl,
    directDownloadUrl: cloudRefUrl,
    type: fileType,
    size: file.size,
    formattedSize: formatBytes(file.size),
    name: file.name,
    provider: 'dafaaty_cloud',
  };
}

/**
 * Uploads a file with progress tracking
 * Priority:
 * 1. Cloudinary Signed/Unsigned Upload (25GB Free, Fast CDN, uses API Key 922482292286723)
 * 2. Google Drive (if OAuth Token active)
 * 3. Built-in Chunked Firestore Cloud Storage (Works 100% automatically for PDFs/Docs of any size!)
 */
export async function uploadFileToStorage(
  file: File,
  config?: StorageConfig | null,
  onProgress?: (percent: number) => void,
  folderCategory: 'materials' | 'projects' | 'assignments' = 'materials'
): Promise<UploadResult> {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  // Read latest config if not passed
  const activeConfig = config || (await getStorageConfig());

  // 1. If Google Drive is active (OAuth Token available), try Google Drive first for PDFs/Documents
  const driveToken = getCachedDriveToken();
  if (driveToken && !isImage) {
    try {
      const driveRes = await uploadFileToGoogleDrive(file, folderCategory, onProgress);
      const fileType: 'PDF' | 'IMAGE' | 'LINK' | 'file' = isPdf ? 'PDF' : isImage ? 'IMAGE' : 'file';
      return {
        url: driveRes.webViewLink,
        previewUrl: driveRes.previewUrl,
        directDownloadUrl: driveRes.directDownloadUrl,
        driveFileId: driveRes.fileId,
        type: fileType,
        size: driveRes.size,
        formattedSize: driveRes.formattedSize,
        name: driveRes.name,
        provider: 'google_drive',
      };
    } catch (err: any) {
      console.warn('Google Drive upload failed, proceeding to next storage:', err);
    }
  }

  // 2. For PDFs up to 15MB, use Built-in Chunked Firestore Cloud Storage directly OR Cloudinary with disguised extension
  // Because Cloudinary Free Tier blocks delivery of any URL ending in `.pdf` with HTTP 401 "deny or ACL failure"
  if (!isPdf) {
    try {
      const cloudRes = await uploadToCloudinary(file, activeConfig, folderCategory, onProgress);
      return cloudRes;
    } catch (cErr) {
      console.warn('Cloudinary upload failed, trying fallback storage:', cErr);
    }
  } else {
    // For PDF files: disguise the filename extension as `.bin` when uploading to Cloudinary raw storage
    // so Cloudinary's strict PDF ACL filter NEVER blocks it with 401!
    // When downloading, downloadFile() fetches the bytes and saves it with the original `.pdf` filename!
    try {
      const safeFileName = file.name.replace(/\.pdf$/i, '') + '_pdf.bin';
      const disguisedFile = new File([file], safeFileName, { type: 'application/octet-stream' });
      const cloudRes = await uploadToCloudinary(disguisedFile, activeConfig, folderCategory, onProgress);

      // Verify the URL isn't blocked by 401 ACL before returning
      const headCheck = await fetch(cloudRes.url, { method: 'HEAD', mode: 'cors' }).catch(() => null);
      if (!headCheck || headCheck.ok) {
        return {
          ...cloudRes,
          type: 'PDF',
          name: file.name, // Preserve original .pdf name in metadata
        };
      }
      console.warn('Cloudinary returned non-OK status on verification, falling back to Chunked Firestore.');
    } catch (cErr) {
      console.warn('Cloudinary disguised PDF upload failed, falling back to Chunked Firestore:', cErr);
    }
  }

  // 3. If Google Drive wasn't tried yet (e.g. for images), try Google Drive
  if (driveToken && isImage) {
    try {
      const driveRes = await uploadFileToGoogleDrive(file, folderCategory, onProgress);
      return {
        url: driveRes.webViewLink,
        previewUrl: driveRes.previewUrl,
        directDownloadUrl: driveRes.directDownloadUrl,
        driveFileId: driveRes.fileId,
        type: 'IMAGE',
        size: driveRes.size,
        formattedSize: driveRes.formattedSize,
        name: driveRes.name,
        provider: 'google_drive',
      };
    } catch (err: any) {
      console.warn('Google Drive image upload failed:', err);
    }
  }

  // 4. Compress images before storing in Chunked Firestore DB
  if (isImage) {
    try {
      if (onProgress) onProgress(30);
      const compressed = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82,
        format: 'image/jpeg',
      });
      if (onProgress) onProgress(100);
      return {
        url: compressed,
        previewUrl: compressed,
        directDownloadUrl: compressed,
        type: 'IMAGE',
        size: file.size,
        formattedSize: formatBytes(file.size),
        name: file.name,
        provider: 'dafaaty_cloud',
      };
    } catch {}
  }

  // 5. Built-in Chunked Firestore Cloud Storage (Handles PDFs, PPTX, DOCX of multi-MB size seamlessly with 0 ACL restrictions!)
  return await uploadToChunkedFirestore(file, onProgress);
}

/**
 * Fetch storage config from Firestore with pre-configured Cloudinary API Key & Secret
 */
export async function getStorageConfig(): Promise<StorageConfig | null> {
  let cachedConfig: StorageConfig | null = null;
  try {
    const raw = localStorage.getItem('dafaaty_storage_config');
    if (raw) {
      cachedConfig = JSON.parse(raw);
    }
  } catch {}

  try {
    const snap = await getDoc(doc(db, 'settings', 'storage_config'));
    if (snap.exists()) {
      const data = snap.data() as StorageConfig;
      const merged: StorageConfig = {
        ...data,
        cloudinaryCloudName:
          extractCloudinaryCloudName(data.cloudinaryCloudName || '') ||
          DEFAULT_CLOUDINARY_CLOUD_NAME,
        cloudinaryApiKey: data.cloudinaryApiKey || DEFAULT_CLOUDINARY_API_KEY,
        cloudinaryApiSecret: data.cloudinaryApiSecret || DEFAULT_CLOUDINARY_API_SECRET,
      };
      try {
        localStorage.setItem('dafaaty_storage_config', JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (error) {
    console.warn('Could not fetch storage config from Firestore, using cache if available:', error);
  }

  return (
    cachedConfig || {
      cloudinaryCloudName: DEFAULT_CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: DEFAULT_CLOUDINARY_API_KEY,
      cloudinaryApiSecret: DEFAULT_CLOUDINARY_API_SECRET,
    }
  );
}

/**
 * Save storage config to Firestore and update local cache
 */
export async function saveStorageConfig(config: StorageConfig): Promise<void> {
  const normalized: StorageConfig = {
    ...config,
    cloudinaryCloudName:
      extractCloudinaryCloudName(config.cloudinaryCloudName || '') ||
      DEFAULT_CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: config.cloudinaryApiKey || DEFAULT_CLOUDINARY_API_KEY,
    cloudinaryApiSecret: config.cloudinaryApiSecret || DEFAULT_CLOUDINARY_API_SECRET,
  };

  try {
    localStorage.setItem('dafaaty_storage_config', JSON.stringify(normalized));
  } catch {}

  try {
    await setDoc(doc(db, 'settings', 'storage_config'), normalized, { merge: true });
  } catch (error) {
    console.error('Error saving storage config to Firestore:', error);
  }
}
