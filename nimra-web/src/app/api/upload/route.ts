import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

const STORAGE_SCOPES = new Set(['products', 'banners']);

export const runtime = 'nodejs';

function isValidImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }

  if (mimeType === 'image/webp') {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  if (mimeType === 'image/gif') {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const scopeValue = String(formData.get('scope') || 'products').toLowerCase();
    const scope = STORAGE_SCOPES.has(scopeValue) ? scopeValue : 'products';

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'Choose an image file to upload.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Only JPG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'Image must be 5 MB or smaller.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isValidImageSignature(buffer, file.type)) {
      return NextResponse.json({ success: false, message: 'The selected file is not a valid image.' }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);
    const uploadDir = path.join(process.cwd(), '.storage', 'uploads', scope);
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
    const diskPath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(diskPath, buffer, { flag: 'wx' });

    const storagePath = `${scope}/${fileName}`;
    const url = `/uploads/${scope}/${fileName}`;

    return NextResponse.json({
      success: true,
      url,
      path: storagePath,
      fileName,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error('Image upload failed:', err);
    return NextResponse.json(
      { success: false, message: 'Unable to upload image right now.' },
      { status: 500 }
    );
  }
}
