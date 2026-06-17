import { handleGet, handlePost } from '@/backend/controllers/cmsController';

export async function GET(req: Request) {
  return handleGet(req);
}

export async function POST(req: Request) {
  return handlePost(req);
}
