interface Env {
  DB: D1Database;
}

// POST /api/links - Create a new link
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;
  const body = await context.request.json() as {
    pageId: string;
    title: string;
    url: string;
    position?: number;
  };

  if (!body.pageId || !body.title || !body.url) {
    return Response.json(
      { error: "pageId, title, and url are required" },
      { status: 400 }
    );
  }

  // Verify page ownership
  const page = await context.env.DB.prepare(
    "SELECT id, user_id FROM pages WHERE id = ?"
  )
    .bind(body.pageId)
    .first<{ id: string; user_id: string }>();

  if (!page || page.user_id !== userId) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  // Check link limit for free users
  const user = await context.env.DB.prepare(
    "SELECT plan FROM users WHERE id = ?"
  )
    .bind(userId)
    .first<{ plan: string }>();

  if (user?.plan === "free") {
    const linkCount = await context.env.DB.prepare(
      "SELECT COUNT(*) as count FROM links WHERE page_id = ?"
    )
      .bind(body.pageId)
      .first<{ count: number }>();

    if (linkCount && linkCount.count >= 5) {
      return Response.json(
        { error: "Free plan allows 5 links per page. Upgrade to Gold for unlimited!" },
        { status: 403 }
      );
    }
  }

  // Get next position
  const maxPos = await context.env.DB.prepare(
    "SELECT MAX(position) as max_pos FROM links WHERE page_id = ?"
  )
    .bind(body.pageId)
    .first<{ max_pos: number | null }>();

  const position = body.position ?? ((maxPos?.max_pos ?? -1) + 1);
  const linkId = crypto.randomUUID();

  await context.env.DB.prepare(
    "INSERT INTO links (id, page_id, title, url, position) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(linkId, body.pageId, body.title, body.url, position)
    .run();

  return Response.json(
    {
      link: {
        id: linkId,
        pageId: body.pageId,
        title: body.title,
        url: body.url,
        enabled: true,
        clicks: 0,
        position,
      },
    },
    { status: 201 }
  );
};
