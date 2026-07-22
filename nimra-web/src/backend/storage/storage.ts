import { blobFileExists, deleteBlobFile, uploadBlobFile } from './blobStorage';
import { deleteLocalFile, localFileExists, uploadLocalFile } from './localStorage';
import { getUploadStoragePath, getVercelBlobStoragePath, isVercelBlobUrl } from '@/utils/uploadImage';

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
  if (isVercelBlobUrl(value)) {
    const storagePath = getVercelBlobStoragePath(value);
    return storagePath.startsWith(`${scope}/`) && blobFileExists(value);
  }
  const storagePath = getUploadStoragePath(value);
  return Boolean(storagePath?.startsWith(`${scope}/`) && await localFileExists(storagePath));
}
