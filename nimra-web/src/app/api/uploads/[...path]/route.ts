import { readFile, stat } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const uploadRoot = path.resolve(process.cwd(), 'public', 'uploads');
    const requestedPath = path.resolve(uploadRoot, ...pathSegments);

    if (!requestedPath.startsWith(uploadRoot + path.sep)) {
      return NextResponse.json({ success: false, message: 'Invalid file path.' }, { status: 400 });
    }

    const fileStat = await stat(requestedPath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ success: false, message: 'File not found.' }, { status: 404 });
    }

    const extension = path.extname(requestedPath).toLowerCase();
    const contentType = MIME_TYPES[extension];
    if (!contentType) {
      return NextResponse.json({ success: false, message: 'Unsupported file type.' }, { status: 415 });
    }

    const file = await readFile(requestedPath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'File not found.' }, { status: 404 });
  }
}
