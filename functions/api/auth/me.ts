interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;

  const user = await context.env.DB.prepare(
    "SELECT id, email, name, plan, created_at as createdAt FROM users WHERE id = ?"
  )
    .bind(userId)
    .first();

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user });
};
