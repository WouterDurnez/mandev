// Cloudflare Pages Functions middleware
// Handles CORS, auth verification, and error handling

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
}

type CFContext = EventContext<Env, string, Record<string, unknown>>;

// Simple JWT-like session verification
async function getSession(request: Request, env: Env) {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return null;

  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  const sessionId = match[1];

  // Check KV for session
  const sessionData = await env.SESSIONS.get(sessionId);
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData);
    if (new Date(session.expiresAt) < new Date()) {
      await env.SESSIONS.delete(sessionId);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export const onRequest: PagesFunction<Env>[] = [
  // CORS middleware
  async (context: CFContext) => {
    // Handle preflight
    if (context.request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Add CORS headers to response
    const response = await context.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  },

  // Auth middleware
  async (context: CFContext) => {
    // Public routes that don't need auth
    const url = new URL(context.request.url);
    const publicPaths = ["/api/auth/login", "/api/auth/signup", "/api/profile/"];
    const isPublic = publicPaths.some((p) => url.pathname.startsWith(p));

    if (!isPublic) {
      const session = await getSession(context.request, context.env);
      if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Attach user to context
      context.data.userId = session.userId;
    }

    return context.next();
  },

  // Error handling
  async (context: CFContext) => {
    try {
      return await context.next();
    } catch (err) {
      console.error("API Error:", err);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
];
