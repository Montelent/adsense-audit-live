import { getBlogById, updateBlog, deleteBlog } from '../../../../lib/store.js';
import { requireAdmin } from '../../../../lib/auth.js';

export async function GET(request, { params }) {
  const blog = getBlogById(params.id);
  if (!blog) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ blog });
}

export async function PUT(request, { params }) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const blog = updateBlog(params.id, body);
    if (!blog) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ blog });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const ok = deleteBlog(params.id);
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ ok: true });
}
