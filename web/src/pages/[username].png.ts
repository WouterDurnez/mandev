import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const username = params.username;
  if (!username) {
    return new Response('Username is required', { status: 400 });
  }

  return Response.redirect(`/${username}.svg`, 302);
};
