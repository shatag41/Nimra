import { handleGet, handlePost } from '@/backend/controllers/cmsController';
import type { NextRequest } from 'next/server';

export async function GET(req: Request) {
  return handleGet(req);
}

export async function POST(req: NextRequest) {
  return handlePost(req);
}
