interface Env {
  DB: D1Database;
}

// GET /api/pages/:id - Get a specific page
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;
  const pageId = context.params.id as string;

  const page = await context.env.DB.prepare(
    "SELECT * FROM pages WHERE id = ? AND user_id = ?"
  )
    .bind(pageId, userId)
    .first();

  if (!page) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  const { results: links } = await context.env.DB.prepare(
    "SELECT * FROM links WHERE page_id = ? ORDER BY position ASC"
  )
    .bind(pageId)
    .all();

  return Response.json({
    page: {
      ...page,
      links: links || [],
      theme: {
        id: page.theme_id,
        ...(page.theme_config ? JSON.parse(page.theme_config as string) : {}),
      },
    },
  });
};

// PUT /api/pages/:id - Update a page
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;
  const pageId = context.params.id as string;
  const body = await context.request.json() as Record<string, unknown>;

  // Verify ownership
  const page = await context.env.DB.prepare(
    "SELECT id FROM pages WHERE id = ? AND user_id = ?"
  )
    .bind(pageId, userId)
    .first();

  if (!page) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) {
    updates.push("title = ?");
    values.push(body.title);
  }
  if (body.bio !== undefined) {
    updates.push("bio = ?");
    values.push(body.bio);
  }
  if (body.slug !== undefined) {
    // Check slug availability
    const existing = await context.env.DB.prepare(
      "SELECT id FROM pages WHERE slug = ? AND id != ?"
    )
      .bind(body.slug, pageId)
      .first();
    if (existing) {
      return Response.json({ error: "Slug already taken" }, { status: 409 });
    }
    updates.push("slug = ?");
    values.push(body.slug);
  }
  if (body.themeId !== undefined) {
    updates.push("theme_id = ?");
    values.push(body.themeId);
  }
  if (body.themeConfig !== undefined) {
    updates.push("theme_config = ?");
    values.push(JSON.stringify(body.themeConfig));
  }
  if (body.published !== undefined) {
    updates.push("published = ?");
    values.push(body.published ? 1 : 0);
  }
  if (body.avatarUrl !== undefined) {
    updates.push("avatar_url = ?");
    values.push(body.avatarUrl);
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  values.push(pageId);

  await context.env.DB.prepare(
    `UPDATE pages SET ${updates.join(", ")} WHERE id = ?`
  )
    .bind(...values)
    .run();

  return Response.json({ success: true });
};

// DELETE /api/pages/:id - Delete a page
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;
  const pageId = context.params.id as string;

  const result = await context.env.DB.prepare(
    "DELETE FROM pages WHERE id = ? AND user_id = ?"
  )
    .bind(pageId, userId)
    .run();

  if (!result.meta.changes) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  return Response.json({ success: true });
};
