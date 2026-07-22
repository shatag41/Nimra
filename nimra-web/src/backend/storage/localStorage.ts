import { mkdir, stat, unlink, writeFile } from 'fs/promises';
import path from 'path';

const UPLOAD_ROOT = path.join('.storage', 'uploads');

function resolveUploadPath(storagePath: string) {
  const uploadRoot = path.resolve(process.cwd(), UPLOAD_ROOT);
  const filePath = path.resolve(uploadRoot, ...storagePath.split('/'));
  if (!filePath.startsWith(uploadRoot + path.sep)) throw new Error('Invalid file path.');
  return filePath;
}

export async function uploadLocalFile(file: File, storagePath: string, contents?: Buffer) {
  const filePath = resolveUploadPath(storagePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents ?? Buffer.from(await file.arrayBuffer()), { flag: 'wx' });
  return `/uploads/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
}

export async function deleteLocalFile(storagePath: string) {
  try {
    await unlink(resolveUploadPath(storagePath));
  } catch (error: unknown) {
    if (!(error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT')) throw error;
  }
}

export async function localFileExists(storagePath: string) {
  try {
    const fileStat = await stat(resolveUploadPath(storagePath));
    return fileStat.isFile() && fileStat.size > 0;
  } catch {
    return false;
  }
}
