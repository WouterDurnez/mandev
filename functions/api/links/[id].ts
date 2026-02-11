interface Env {
  DB: D1Database;
}

// PUT /api/links/:id - Update a link
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;
  const linkId = context.params.id as string;
  const body = await context.request.json() as Record<string, unknown>;

  // Verify ownership through page
  const link = await context.env.DB.prepare(
    `SELECT l.id, p.user_id
     FROM links l
     JOIN pages p ON l.page_id = p.id
     WHERE l.id = ?`
  )
    .bind(linkId)
    .first<{ id: string; user_id: string }>();

  if (!link || link.user_id !== userId) {
    return Response.json({ error: "Link not found" }, { status: 404 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) {
    updates.push("title = ?");
    values.push(body.title);
  }
  if (body.url !== undefined) {
    updates.push("url = ?");
    values.push(body.url);
  }
  if (body.enabled !== undefined) {
    updates.push("enabled = ?");
    values.push(body.enabled ? 1 : 0);
  }
  if (body.position !== undefined) {
    updates.push("position = ?");
    values.push(body.position);
  }
  if (body.icon !== undefined) {
    updates.push("icon = ?");
    values.push(body.icon);
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  values.push(linkId);

  await context.env.DB.prepare(
    `UPDATE links SET ${updates.join(", ")} WHERE id = ?`
  )
    .bind(...values)
    .run();

  return Response.json({ success: true });
};

// DELETE /api/links/:id - Delete a link
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;
  const linkId = context.params.id as string;

  // Verify ownership
  const link = await context.env.DB.prepare(
    `SELECT l.id, p.user_id
     FROM links l
     JOIN pages p ON l.page_id = p.id
     WHERE l.id = ?`
  )
    .bind(linkId)
    .first<{ id: string; user_id: string }>();

  if (!link || link.user_id !== userId) {
    return Response.json({ error: "Link not found" }, { status: 404 });
  }

  await context.env.DB.prepare("DELETE FROM links WHERE id = ?")
    .bind(linkId)
    .run();

  return Response.json({ success: true });
};
