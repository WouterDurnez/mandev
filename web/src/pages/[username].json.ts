import type { APIRoute } from 'astro';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

export const GET: APIRoute = async ({ params }) => {
  const username = params.username;

  if (!username) {
    return new Response(
      JSON.stringify({ detail: 'Username is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const upstream = await fetch(`${API_URL}/api/profile/${username}`);
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ detail: 'Upstream profile service unavailable' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
