import { listBlogs, createBlog, getStats } from '../../../lib/store.js';
import { requireAdmin } from '../../../lib/auth.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all') === '1';
  if (all) {
    const admin = await requireAdmin(request);
    if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return Response.json({ blogs: listBlogs({ publishedOnly: false }), stats: getStats() });
  }
  return Response.json({ blogs: listBlogs({ publishedOnly: true }) });
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.title) return Response.json({ error: 'Title required' }, { status: 400 });
    const blog = createBlog(body);
    return Response.json({ blog }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
