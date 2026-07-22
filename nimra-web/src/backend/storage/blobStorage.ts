import { del, put } from '@vercel/blob';

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
