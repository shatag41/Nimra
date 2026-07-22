import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, isBlobStorage, uploadFile } from '@/backend/storage/storage';
import { isAdminStorageRequest } from '@/backend/storage/storageAuth';
import { getStoredUploadValue } from '@/utils/uploadImage';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Vercel Functions reject request bodies above 4.5 MB. Multipart form data
// adds overhead, so keep Blob-backed server uploads safely below that limit.
const MAX_BLOB_FILE_SIZE = 4 * 1024 * 1024;
const PRODUCT_RATIO_WIDTH = 3;
const PRODUCT_RATIO_HEIGHT = 4;
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

function readUInt24LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
}

function getImageDimensions(bytes: Buffer, mimeType: string): { width: number; height: number } | null {
  if (mimeType === 'image/png' && bytes.length >= 24) {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }

  if (mimeType === 'image/gif' && bytes.length >= 10) {
    return {
      width: bytes.readUInt16LE(6),
      height: bytes.readUInt16LE(8),
    };
  }

  if (mimeType === 'image/jpeg') {
    let offset = 2;
    while (offset < bytes.length) {
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset];
      offset += 1;

      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0xda || offset + 2 > bytes.length) break;

      const blockLength = bytes.readUInt16BE(offset);
      const isStartOfFrame = (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc5 ||
        marker === 0xc6 ||
        marker === 0xc7 ||
        marker === 0xc9 ||
        marker === 0xca ||
        marker === 0xcb ||
        marker === 0xcd ||
        marker === 0xce ||
        marker === 0xcf
      );

      if (isStartOfFrame && offset + 7 <= bytes.length) {
        return {
          height: bytes.readUInt16BE(offset + 3),
          width: bytes.readUInt16BE(offset + 5),
        };
      }

      offset += blockLength;
    }
  }

  if (mimeType === 'image/webp' && bytes.length >= 30) {
    const chunk = bytes.toString('ascii', 12, 16);

    if (chunk === 'VP8X') {
      return {
        width: readUInt24LE(bytes, 24) + 1,
        height: readUInt24LE(bytes, 27) + 1,
      };
    }

    if (chunk === 'VP8 ' && bytes.length >= 30) {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }

    if (chunk === 'VP8L' && bytes.length >= 25) {
      const b0 = bytes[21];
      const b1 = bytes[22];
      const b2 = bytes[23];
      const b3 = bytes[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }
  }

  return null;
}

function isProductRatio(width: number, height: number) {
  return width > 0 && height > 0 && width * PRODUCT_RATIO_HEIGHT === height * PRODUCT_RATIO_WIDTH;
}

function isSquareRatio(width: number, height: number) {
  return width > 0 && height > 0 && width === height;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdminStorageRequest(req)) {
      return NextResponse.json({ success: false, message: 'Admin authentication is required.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const scopeValue = String(formData.get('scope') || 'products').toLowerCase();
    const imageKind = String(formData.get('imageKind') || 'product').toLowerCase();
    if (!STORAGE_SCOPES.has(scopeValue)) {
      return NextResponse.json({ success: false, message: 'Invalid image storage scope.' }, { status: 400 });
    }
    const scope = scopeValue;

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

    if (isBlobStorage() && file.size > MAX_BLOB_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Images uploaded on Vercel must be 4 MB or smaller.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isValidImageSignature(buffer, file.type)) {
      return NextResponse.json({ success: false, message: 'The selected file is not a valid image.' }, { status: 400 });
    }

    const dimensions = getImageDimensions(buffer, file.type);
    if (scope === 'products') {
      if (!dimensions) {
        return NextResponse.json({ success: false, message: 'Unable to verify product image dimensions.' }, { status: 400 });
      }

      const isUpcoming = imageKind === 'upcoming';
      const hasValidRatio = isUpcoming
        ? isSquareRatio(dimensions.width, dimensions.height)
        : isProductRatio(dimensions.width, dimensions.height);

      if (!hasValidRatio) {
        return NextResponse.json(
          {
            success: false,
            message: `${isUpcoming ? 'Upcoming product images must use a square 1:1 ratio' : 'Product images must use a 3:4 ratio'}. Selected image is ${dimensions.width}x${dimensions.height}px.`,
          },
          { status: 400 }
        );
      }
    }

    const extension = ALLOWED_TYPES.get(file.type);
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
    const storedFile = await uploadFile(file, scope as 'products' | 'banners', fileName, buffer);

    return NextResponse.json({
      success: true,
      url: storedFile.url,
      path: storedFile.path,
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

export async function DELETE(req: NextRequest) {
  try {
    if (!isAdminStorageRequest(req)) {
      return NextResponse.json({ success: false, message: 'Admin authentication is required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawPath = String(body.path || '').trim();

    if (!rawPath) {
      return NextResponse.json({ success: false, message: 'Image path is required.' }, { status: 400 });
    }

    const storedValue = getStoredUploadValue(rawPath);
    if (!storedValue) {
      return NextResponse.json({ success: false, message: 'Invalid image path.' }, { status: 400 });
    }

    await deleteFile(storedValue);

    return NextResponse.json({ success: true, message: 'Image deleted successfully.' });
  } catch (err) {
    console.error('[Upload API] DELETE failed:', err);
    return NextResponse.json(
      { success: false, message: 'Unable to delete image right now.' },
      { status: 500 }
    );
  }
}
