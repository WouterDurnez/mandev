interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { name, email, password } = await context.request.json() as {
    name: string;
    email: string;
    password: string;
  };

  if (!name || !email || !password) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  // Check if email exists
  const existing = await context.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?"
  )
    .bind(email.toLowerCase())
    .first();

  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  // Hash password using Web Crypto API (available in Workers)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Create user
  const userId = crypto.randomUUID();
  await context.env.DB.prepare(
    "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)"
  )
    .bind(userId, email.toLowerCase(), name, passwordHash)
    .run();

  // Create session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  await context.env.SESSIONS.put(
    sessionId,
    JSON.stringify({ userId, expiresAt }),
    { expirationTtl: 30 * 24 * 60 * 60 }
  );

  const response = Response.json({
    user: { id: userId, email: email.toLowerCase(), name, plan: "free" },
  });

  // Set session cookie
  response.headers.set(
    "Set-Cookie",
    `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );

  return response;
};
