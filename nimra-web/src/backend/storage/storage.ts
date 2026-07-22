import { deleteBlobFile, uploadBlobFile } from './blobStorage';
import { deleteLocalFile, localFileExists, uploadLocalFile } from './localStorage';
import { getUploadStoragePath, isAbsoluteHttpUrl, isVercelBlobUrl } from '@/utils/uploadImage';

export type StorageScope = 'products' | 'banners';

export interface StoredFile {
  url: string;
  path: string;
}

export function isBlobStorage() {
  return process.env.STORAGE_PROVIDER?.toLowerCase() === 'blob';
}

export async function uploadFile(file: File, scope: StorageScope, fileName: string, contents?: Buffer): Promise<StoredFile> {
  const storagePath = `${scope}/${fileName}`;
  const useBlob = isBlobStorage();
  const url = useBlob
    ? await uploadBlobFile(file, storagePath)
    : await uploadLocalFile(file, storagePath, contents);
  return { url, path: useBlob ? url : storagePath };
}

export async function deleteFile(value: string) {
  if (isVercelBlobUrl(value)) return deleteBlobFile(value);
  const storagePath = getUploadStoragePath(value);
  if (storagePath) await deleteLocalFile(storagePath);
}

export async function fileExists(value: string, scope: StorageScope) {
  // External HTTP(S) images are already remotely hosted and do not have a
  // corresponding local file to stat. Preserve them unchanged for display;
  // requiring Blob metadata here can erase valid public URLs if head() fails.
  if (isAbsoluteHttpUrl(value)) return true;
  const storagePath = getUploadStoragePath(value);
  return Boolean(storagePath?.startsWith(`${scope}/`) && await localFileExists(storagePath));
}
