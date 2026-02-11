interface Env {
  DB: D1Database;
}

// GET /api/profile/:slug - Get public profile (no auth required)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const slug = context.params.slug as string;

  const page = await context.env.DB.prepare(
    `SELECT p.id, p.slug, p.title, p.bio, p.avatar_url, p.theme_id, p.theme_config, p.published
     FROM pages p
     WHERE p.slug = ? AND p.published = 1`
  )
    .bind(slug)
    .first();

  if (!page) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  // Fetch links
  const { results: links } = await context.env.DB.prepare(
    "SELECT id, title, url, icon, position FROM links WHERE page_id = ? AND enabled = 1 ORDER BY position ASC"
  )
    .bind(page.id as string)
    .all();

  // Record page view (fire and forget)
  const request = context.request;
  const country = (request as Request & { cf?: { country?: string } }).cf?.country || "unknown";
  const ua = request.headers.get("User-Agent") || "";
  const device = /mobile/i.test(ua) ? "mobile" : "desktop";
  const referrer = request.headers.get("Referer") || "";

  context.env.DB.prepare(
    "INSERT INTO view_events (page_id, referrer, country, device) VALUES (?, ?, ?, ?)"
  )
    .bind(page.id, referrer, country, device)
    .run()
    .catch(() => {}); // Don't fail on analytics errors

  // Increment view count
  context.env.DB.prepare("UPDATE pages SET views = views + 1 WHERE id = ?")
    .bind(page.id)
    .run()
    .catch(() => {});

  return Response.json({
    page: {
      slug: page.slug,
      title: page.title,
      bio: page.bio,
      avatarUrl: page.avatar_url,
      theme: {
        id: page.theme_id,
        ...(page.theme_config ? JSON.parse(page.theme_config as string) : {}),
      },
      links: (links || []).map((l: Record<string, unknown>) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon,
      })),
    },
  });
};

// POST /api/profile/:slug/click - Record a click
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const slug = context.params.slug as string;
  const { linkId } = await context.request.json() as { linkId: string };

  if (!linkId) {
    return Response.json({ error: "linkId required" }, { status: 400 });
  }

  const page = await context.env.DB.prepare(
    "SELECT id FROM pages WHERE slug = ?"
  )
    .bind(slug)
    .first<{ id: string }>();

  if (!page) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  const request = context.request;
  const country = (request as Request & { cf?: { country?: string } }).cf?.country || "unknown";
  const ua = request.headers.get("User-Agent") || "";
  const device = /mobile/i.test(ua) ? "mobile" : "desktop";
  const referrer = request.headers.get("Referer") || "";

  // Record click event
  await context.env.DB.batch([
    context.env.DB.prepare(
      "INSERT INTO click_events (link_id, page_id, referrer, country, device) VALUES (?, ?, ?, ?, ?)"
    ).bind(linkId, page.id, referrer, country, device),
    context.env.DB.prepare(
      "UPDATE links SET clicks = clicks + 1 WHERE id = ?"
    ).bind(linkId),
    context.env.DB.prepare(
      "UPDATE pages SET clicks = clicks + 1 WHERE id = ?"
    ).bind(page.id),
  ]);

  return Response.json({ success: true });
};
