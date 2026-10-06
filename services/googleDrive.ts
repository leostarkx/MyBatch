import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, saveSettingToFirestore, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Scopes required for Google Drive file management
// Using 'drive.file' ensures any Google account can connect without Google 403 access_denied / test user restrictions
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

export interface StorageVaultSlot {
  slotId: number; // 1, 2, or 3
  title: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  storageLimit: number; // bytes
  storageUsage: number; // bytes
  storageUsageInDrive: number; // bytes
  formattedLimit: string;
  formattedUsage: string;
  percentUsed: number;
  isActive: boolean;
  connectedAt: number;
}

export interface StoragePoolInfo {
  totalCapacity: number;
  totalUsage: number;
  totalPercent: number;
  formattedTotalCapacity: string;
  formattedTotalUsage: string;
  activeSlotId: number;
  slots: StorageVaultSlot[];
}

export interface DriveAccountInfo {
  email: string;
  displayName: string;
  photoUrl?: string;
  storageLimit: number;
  storageUsage: number;
  storageUsageInDrive: number;
  formattedLimit: string;
  formattedUsage: string;
  percentUsed: number;
  connectedAt: number;
}

// In-memory token cache per slot (strictly in-memory, NEVER in localStorage or sessionStorage)
const slotTokens: Record<number, string> = {};
let activeSlotId = 1;

export function getCachedDriveToken(slotId?: number): string | null {
  if (slotId && slotTokens[slotId]) {
    return slotTokens[slotId];
  }
  if (slotTokens[activeSlotId]) {
    return slotTokens[activeSlotId];
  }
  // Fallback to first available token in pool
  const availableSlots = Object.keys(slotTokens).map(Number);
  if (availableSlots.length > 0) {
    return slotTokens[availableSlots[0]];
  }
  return null;
}

export function setCachedDriveToken(token: string | null, slotId: number = 1): void {
  if (token) {
    slotTokens[slotId] = token;
  } else {
    delete slotTokens[slotId];
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

/**
 * Fetch storage quota and user info from Google Drive API
 */
export async function fetchDriveAccountInfo(token: string): Promise<DriveAccountInfo> {
  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Drive about.get error:', errorText);
    throw new Error('تعذر جلب بيانات مساحة التخزين من Google Drive');
  }

  const data = await res.json();
  const quota = data.storageQuota || {};
  const user = data.user || {};

  const storageLimit = Number(quota.limit || 15 * 1024 * 1024 * 1024); // default 15GB
  const storageUsage = Number(quota.usage || 0);
  const storageUsageInDrive = Number(quota.usageInDrive || 0);

  const percentUsed = storageLimit > 0 ? Math.min(100, Math.round((storageUsage / storageLimit) * 100)) : 0;

  return {
    email: user.emailAddress || '',
    displayName: user.displayName || 'Google Drive',
    photoUrl: user.photoLink || '',
    storageLimit,
    storageUsage,
    storageUsageInDrive,
    formattedLimit: formatBytes(storageLimit),
    formattedUsage: formatBytes(storageUsage),
    percentUsed,
    connectedAt: Date.now(),
  };
}

/**
 * Fetch current 3-Account Storage Pool from Firestore
 */
export async function getStoragePool(): Promise<StoragePoolInfo> {
  const defaultSlots: StorageVaultSlot[] = [
    {
      slotId: 1,
      title: 'الحساب الرئيسي (1)',
      email: '',
      displayName: 'غير مربوط',
      storageLimit: 15 * 1024 * 1024 * 1024,
      storageUsage: 0,
      storageUsageInDrive: 0,
      formattedLimit: '15 GB',
      formattedUsage: '0 GB',
      percentUsed: 0,
      isActive: true,
      connectedAt: 0,
    },
    {
      slotId: 2,
      title: 'الحساب الاحتياطي (2)',
      email: '',
      displayName: 'غير مربوط',
      storageLimit: 15 * 1024 * 1024 * 1024,
      storageUsage: 0,
      storageUsageInDrive: 0,
      formattedLimit: '15 GB',
      formattedUsage: '0 GB',
      percentUsed: 0,
      isActive: false,
      connectedAt: 0,
    },
    {
      slotId: 3,
      title: 'الحساب الاحتياطي (3)',
      email: '',
      displayName: 'غير مربوط',
      storageLimit: 15 * 1024 * 1024 * 1024,
      storageUsage: 0,
      storageUsageInDrive: 0,
      formattedLimit: '15 GB',
      formattedUsage: '0 GB',
      percentUsed: 0,
      isActive: false,
      connectedAt: 0,
    },
  ];

  try {
    const snap = await getDoc(doc(db, 'settings', 'google_drive_pool'));
    if (snap.exists()) {
      const data = snap.data();
      const slots: StorageVaultSlot[] = (data.slots || defaultSlots).map((s: any) => ({
        ...s,
        storageLimit: Number(s.storageLimit || 15 * 1024 * 1024 * 1024),
        storageUsage: Number(s.storageUsage || 0),
        storageUsageInDrive: Number(s.storageUsageInDrive || 0),
        formattedLimit: formatBytes(Number(s.storageLimit || 15 * 1024 * 1024 * 1024)),
        formattedUsage: formatBytes(Number(s.storageUsage || 0)),
        percentUsed: s.storageLimit > 0 ? Math.min(100, Math.round((Number(s.storageUsage || 0) / Number(s.storageLimit)) * 100)) : 0,
      }));

      // Calculate totals
      const totalCapacity = slots.reduce((acc, s) => acc + (s.email ? s.storageLimit : 0), 0) || 45 * 1024 * 1024 * 1024;
      const totalUsage = slots.reduce((acc, s) => acc + (s.email ? s.storageUsage : 0), 0);
      const totalPercent = totalCapacity > 0 ? Math.min(100, Math.round((totalUsage / totalCapacity) * 100)) : 0;
      const currentActiveId = data.activeSlotId || 1;
      activeSlotId = currentActiveId;

      return {
        totalCapacity,
        totalUsage,
        totalPercent,
        formattedTotalCapacity: formatBytes(totalCapacity),
        formattedTotalUsage: formatBytes(totalUsage),
        activeSlotId: currentActiveId,
        slots,
      };
    }
  } catch (err) {
    console.warn('Error reading storage pool:', err);
  }

  return {
    totalCapacity: 45 * 1024 * 1024 * 1024,
    totalUsage: 0,
    totalPercent: 0,
    formattedTotalCapacity: '45 GB',
    formattedTotalUsage: '0 GB',
    activeSlotId: 1,
    slots: defaultSlots,
  };
}

/**
 * Connect a specific vault slot (Slot 1, 2, or 3) via Google Sign-In popup
 */
export async function connectVaultSlot(slotId: number): Promise<StorageVaultSlot | null> {
  const provider = new GoogleAuthProvider();
  SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'select_account' });

  let result;
  try {
    result = await signInWithPopup(auth, provider);
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.message?.includes('popup-closed-by-user') ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.message?.includes('cancelled-popup-request')
    ) {
      // User closed the popup intentionally
      return null;
    }
    throw err;
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('فشل الحصول على تصريح الوصول إلى Google Drive من Google Auth');
  }

  const token = credential.accessToken;
  slotTokens[slotId] = token;

  // Fetch account quota
  const accountInfo = await fetchDriveAccountInfo(token);

  // Update current pool
  const currentPool = await getStoragePool();
  const updatedSlots = currentPool.slots.map((s) => {
    if (s.slotId === slotId) {
      return {
        ...s,
        email: accountInfo.email,
        displayName: accountInfo.displayName,
        photoUrl: accountInfo.photoUrl,
        storageLimit: accountInfo.storageLimit,
        storageUsage: accountInfo.storageUsage,
        storageUsageInDrive: accountInfo.storageUsageInDrive,
        formattedLimit: accountInfo.formattedLimit,
        formattedUsage: accountInfo.formattedUsage,
        percentUsed: accountInfo.percentUsed,
        isActive: slotId === currentPool.activeSlotId || !currentPool.slots.some((x) => x.isActive && x.email),
        connectedAt: Date.now(),
      };
    }
    return s;
  });

  const activeSlot = updatedSlots.find((s) => s.slotId === slotId)!;
  activeSlotId = slotId;

  // Persist pool to Firestore
  await saveSettingToFirestore('google_drive_pool', {
    slots: updatedSlots,
    activeSlotId,
    updatedAt: Date.now(),
  });

  // Also maintain backwards-compatible single setting
  await saveSettingToFirestore('google_drive_storage', {
    isConfigured: true,
    email: activeSlot.email,
    displayName: activeSlot.displayName,
    photoUrl: activeSlot.photoUrl,
    storageLimit: activeSlot.storageLimit,
    storageUsage: activeSlot.storageUsage,
    formattedLimit: activeSlot.formattedLimit,
    formattedUsage: activeSlot.formattedUsage,
    percentUsed: activeSlot.percentUsed,
    updatedAt: Date.now(),
  });

  return activeSlot;
}

/**
 * Disconnect a specific vault slot
 */
export async function disconnectVaultSlot(slotId: number): Promise<void> {
  delete slotTokens[slotId];

  const currentPool = await getStoragePool();
  const updatedSlots = currentPool.slots.map((s) => {
    if (s.slotId === slotId) {
      return {
        ...s,
        email: '',
        displayName: 'غير مربوط',
        photoUrl: undefined,
        storageUsage: 0,
        storageUsageInDrive: 0,
        formattedUsage: '0 GB',
        percentUsed: 0,
        isActive: false,
        connectedAt: 0,
      };
    }
    return s;
  });

  // Pick new active slot if needed
  const nextAvailable = updatedSlots.find((s) => s.email);
  const newActiveId = nextAvailable ? nextAvailable.slotId : 1;
  activeSlotId = newActiveId;

  await saveSettingToFirestore('google_drive_pool', {
    slots: updatedSlots,
    activeSlotId: newActiveId,
    updatedAt: Date.now(),
  });

  if (!nextAvailable) {
    await saveSettingToFirestore('google_drive_storage', {
      isConfigured: false,
      updatedAt: Date.now(),
    });
  }
}

/**
 * Set which slot is active for uploading new files
 */
export async function setActiveUploadSlot(slotId: number): Promise<void> {
  const currentPool = await getStoragePool();
  const updatedSlots = currentPool.slots.map((s) => ({
    ...s,
    isActive: s.slotId === slotId,
  }));
  activeSlotId = slotId;

  await saveSettingToFirestore('google_drive_pool', {
    slots: updatedSlots,
    activeSlotId: slotId,
    updatedAt: Date.now(),
  });
}

/**
 * Legacy single-account connect wrapper for backward compatibility
 */
export async function connectGoogleDriveAccount(): Promise<DriveAccountInfo | null> {
  const slot = await connectVaultSlot(1);
  if (!slot) return null;
  return {
    email: slot.email,
    displayName: slot.displayName,
    photoUrl: slot.photoUrl,
    storageLimit: slot.storageLimit,
    storageUsage: slot.storageUsage,
    storageUsageInDrive: slot.storageUsageInDrive,
    formattedLimit: slot.formattedLimit,
    formattedUsage: slot.formattedUsage,
    percentUsed: slot.percentUsed,
    connectedAt: slot.connectedAt,
  };
}

/**
 * Legacy single-account disconnect wrapper for backward compatibility
 */
export async function disconnectGoogleDrive(): Promise<void> {
  await disconnectVaultSlot(1);
}

/**
 * Find or create a specific folder in Google Drive
 */
async function getOrCreateFolder(token: string, folderName: string, parentFolderId?: string): Promise<string> {
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    throw new Error(`تعذر إنشاء مجلد [${folderName}] على Google Drive`);
  }

  const createData = await createRes.json();
  return createData.id;
}

export interface DriveUploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  previewUrl: string;
  directDownloadUrl: string;
  size: number;
  formattedSize: string;
  vaultSlotId: number;
}

/**
 * Upload a file directly to Google Drive with progress tracking
 */
export async function uploadFileToGoogleDrive(
  file: File,
  folderCategory: 'materials' | 'projects' | 'assignments' = 'materials',
  onProgress?: (percent: number) => void
): Promise<DriveUploadResult> {
  // Check active slot token, or any available slot token
  let token = getCachedDriveToken(activeSlotId);
  let usedSlotId = activeSlotId;

  if (!token) {
    token = getCachedDriveToken();
    if (!token) {
      throw new Error('يرجى تسجيل الدخول أو ربط حساب Google Drive أولاً للمتابعة');
    }
    const foundSlot = Object.keys(slotTokens).find((k) => slotTokens[Number(k)] === token);
    if (foundSlot) usedSlotId = Number(foundSlot);
  }

  // 1. Ensure Folder Structure
  const rootFolderId = await getOrCreateFolder(token, 'دفعتي - التخزين السحابي');
  const subfolderName =
    folderCategory === 'materials'
      ? 'المحاضرات والملازم'
      : folderCategory === 'projects'
      ? 'مشاريع الطلاب'
      : 'الواجبات والتكليفات';
  const targetFolderId = await getOrCreateFolder(token, subfolderName, rootFolderId);

  // 2. Perform Multipart Upload with real progress tracking via XMLHttpRequest
  const boundary = `-------DafaatyBoundary${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: file.name,
    parents: [targetFolderId],
    description: `ملف مرفوع عبر تطبيق دفعتي - قسم ${subfolderName}`,
  };

  const metadataBlob = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
  ]);

  const closeBlob = new Blob([closeDelimiter]);
  const multipartBody = new Blob([metadataBlob, file, closeBlob]);

  const uploadResult = await new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size'
    );
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

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
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new Error('فشل قراءة بيانات الملف من Google Drive'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error?.message || `فشل رفع الملف (${xhr.status})`));
        } catch {
          reject(new Error(`فشل رفع الملف إلى Google Drive (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('فشل الاتصال بـ Google Drive. يرجى التحقق من اتصال الإنترنت.'));
    };

    xhr.send(multipartBody);
  });

  // 3. Make the uploaded file publicly readable so all batch students can open and download it
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (err) {
    console.warn('Could not set public permission on Drive file:', err);
  }

  const fileId = uploadResult.id;
  const webViewLink = uploadResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  const webContentLink = uploadResult.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  return {
    fileId,
    name: uploadResult.name || file.name,
    mimeType: uploadResult.mimeType || file.type,
    webViewLink,
    webContentLink,
    previewUrl,
    directDownloadUrl: webContentLink,
    size: Number(uploadResult.size || file.size),
    formattedSize: formatBytes(Number(uploadResult.size || file.size)),
    vaultSlotId: usedSlotId,
  };
}

/**
 * Delete a file from Google Drive with mandatory user confirmation dialog
 */
export async function deleteFileFromGoogleDrive(fileId: string, fileName?: string): Promise<boolean> {
  const confirmed = window.confirm(
    `هل أنت متأكد من حذف الملف "${fileName || 'المحدد'}" نهائياً من Google Drive؟ لن يمكن التراجع عن هذا الإجراء.`
  );
  if (!confirmed) return false;

  const token = getCachedDriveToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول وإعادة المصادقة لحذف الملف من Google Drive');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`فشل حذف الملف من Google Drive (${res.status})`);
  }

  return true;
}
