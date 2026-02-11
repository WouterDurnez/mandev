interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { email, password } = await context.request.json() as {
    email: string;
    password: string;
  };

  if (!email || !password) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Hash the provided password
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Find user
  const user = await context.env.DB.prepare(
    "SELECT id, email, name, plan FROM users WHERE email = ? AND password_hash = ?"
  )
    .bind(email.toLowerCase(), passwordHash)
    .first<{ id: string; email: string; name: string; plan: string }>();

  if (!user) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await context.env.SESSIONS.put(
    sessionId,
    JSON.stringify({ userId: user.id, expiresAt }),
    { expirationTtl: 30 * 24 * 60 * 60 }
  );

  const response = Response.json({ user });

  response.headers.set(
    "Set-Cookie",
    `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );

  return response;
};
