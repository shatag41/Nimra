import { del, head, put } from '@vercel/blob';

export async function uploadBlobFile(file: File, storagePath: string) {
  const blob = await put(storagePath, file, {
    access: 'public',
    addRandomSuffix: false,
    cacheControlMaxAge: 31536000,
    contentType: file.type,
  });
  return blob.url;
}

export async function deleteBlobFile(url: string) {
  await del(url);
}

export async function blobFileExists(url: string) {
  try {
    const blob = await head(url);
    return blob.size > 0 && blob.contentType.startsWith('image/');
  } catch {
    return false;
  }
}
