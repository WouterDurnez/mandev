interface Env {
  DB: D1Database;
}

// GET /api/pages - List user's pages
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;

  const { results } = await context.env.DB.prepare(
    `SELECT p.*,
            (SELECT COUNT(*) FROM links WHERE page_id = p.id) as link_count
     FROM pages p
     WHERE p.user_id = ?
     ORDER BY p.updated_at DESC`
  )
    .bind(userId)
    .all();

  // Fetch links for each page
  const pages = await Promise.all(
    (results || []).map(async (page: Record<string, unknown>) => {
      const { results: links } = await context.env.DB.prepare(
        "SELECT * FROM links WHERE page_id = ? ORDER BY position ASC"
      )
        .bind(page.id as string)
        .all();

      return {
        ...page,
        links: links || [],
        theme: {
          id: page.theme_id,
          ...(page.theme_config ? JSON.parse(page.theme_config as string) : {}),
        },
      };
    })
  );

  return Response.json({ pages });
};

// POST /api/pages - Create a new page
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;
  const body = await context.request.json() as {
    slug: string;
    title: string;
    bio?: string;
    themeId?: string;
  };

  if (!body.slug || !body.title) {
    return Response.json({ error: "Slug and title are required" }, { status: 400 });
  }

  // Validate slug
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;
  if (!slugRegex.test(body.slug)) {
    return Response.json(
      { error: "Slug must be 3-64 characters, lowercase letters, numbers, and hyphens" },
      { status: 400 }
    );
  }

  // Check slug availability
  const existing = await context.env.DB.prepare(
    "SELECT id FROM pages WHERE slug = ?"
  )
    .bind(body.slug)
    .first();

  if (existing) {
    return Response.json(
      { error: "This URL is already taken. Try another one!" },
      { status: 409 }
    );
  }

  // Check page limit for free users
  const user = await context.env.DB.prepare(
    "SELECT plan FROM users WHERE id = ?"
  )
    .bind(userId)
    .first<{ plan: string }>();

  if (user?.plan === "free") {
    const { count } = await context.env.DB.prepare(
      "SELECT COUNT(*) as count FROM pages WHERE user_id = ?"
    )
      .bind(userId)
      .first<{ count: number }>() || { count: 0 };

    if (count >= 1) {
      return Response.json(
        { error: "Free plan allows 1 page. Upgrade to Gold for unlimited pages!" },
        { status: 403 }
      );
    }
  }

  const pageId = crypto.randomUUID();
  await context.env.DB.prepare(
    `INSERT INTO pages (id, user_id, slug, title, bio, theme_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(pageId, userId, body.slug, body.title, body.bio || "", body.themeId || "midnight-gold")
    .run();

  return Response.json(
    {
      page: {
        id: pageId,
        slug: body.slug,
        title: body.title,
        bio: body.bio || "",
        themeId: body.themeId || "midnight-gold",
        published: false,
        views: 0,
        clicks: 0,
        links: [],
      },
    },
    { status: 201 }
  );
};
