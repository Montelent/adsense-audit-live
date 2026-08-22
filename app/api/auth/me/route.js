import { getSession } from '../../../../lib/auth.js';

export async function GET(request) {
  const session = await getSession(request);
  if (!session) return Response.json({ user: null });
  return Response.json({
    user: {
      id: session.sub,
      email: session.email,
      name: session.name,
      role: session.role,
      plan: session.plan || 'free',
    },
  });
}
