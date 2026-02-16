import type { APIRoute } from 'astro';
import { Resvg } from '@resvg/resvg-js';
import { getScheme } from '../lib/schemes';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

interface ProfileData {
  username?: string;
  profile?: { name: string; tagline?: string; avatar?: string };
  theme?: { scheme?: string };
  skills?: { name: string; level: string }[];
  github_stats?: {
    total_stars: number;
    total_repos: number;
    total_contributions: number;
    followers: number;
  } | null;
}

const CARD_W = 600;
const CARD_H = 300;
const PAD = 24;
const FONT = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";

const fillMap: Record<string, number> = {
  beginner: 0.25,
  intermediate: 0.5,
  advanced: 0.75,
  expert: 1.0,
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCard(username: string, data: ProfileData): string {
  const c = getScheme(data.theme?.scheme);
  const profile = data.profile;
  const name = profile?.name || username;
  const tagline = profile?.tagline || '';
  const skills = (data.skills || []).slice(0, 5);
  const stats = data.github_stats;

  let y = PAD + 20;
  const lines: string[] = [];

  lines.push(`<text x="${PAD}" y="${y}" fill="${c.fg}" font-size="18" font-weight="bold" font-family="${FONT}">${escapeXml(name)}</text>`);
  y += 22;

  if (tagline) {
    lines.push(`<text x="${PAD}" y="${y}" fill="${c.dim}" font-size="12" font-family="${FONT}">${escapeXml(tagline)}</text>`);
    y += 20;
  }

  y += 8;

  if (skills.length > 0) {
    lines.push(`<text x="${PAD}" y="${y}" fill="${c.accent}" font-size="10" font-weight="bold" font-family="${FONT}">SKILLS</text>`);
    y += 16;
    const barW = 120;
    const barH = 8;
    for (const skill of skills) {
      const fill = fillMap[skill.level] || 0;
      lines.push(`<text x="${PAD}" y="${y + 1}" fill="${c.fg}" font-size="10" font-family="${FONT}">${escapeXml(skill.name)}</text>`);
      lines.push(`<rect x="${PAD + 130}" y="${y - 7}" width="${barW}" height="${barH}" rx="2" fill="${c.border}" />`);
      if (fill > 0) {
        lines.push(`<rect x="${PAD + 130}" y="${y - 7}" width="${Math.round(barW * fill)}" height="${barH}" rx="2" fill="${c.accent}" />`);
      }
      y += 18;
    }
  }

  if (stats) {
    y = Math.max(y + 4, CARD_H - 50);
    lines.push(`<text x="${PAD}" y="${y}" fill="${c.accent}" font-size="10" font-weight="bold" font-family="${FONT}">GITHUB</text>`);
    y += 16;
    const statItems = [
      `★ ${stats.total_stars.toLocaleString()}`,
      `repos: ${stats.total_repos.toLocaleString()}`,
      `contrib: ${stats.total_contributions.toLocaleString()}`,
      `followers: ${stats.followers.toLocaleString()}`,
    ];
    lines.push(`<text x="${PAD}" y="${y}" fill="${c.dim}" font-size="10" font-family="${FONT}">${statItems.join('  ·  ')}</text>`);
  }

  lines.push(`<text x="${CARD_W - PAD}" y="${CARD_H - 12}" fill="${c.dim}" font-size="10" font-family="${FONT}" text-anchor="end">man.dev/${escapeXml(username)}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <rect width="${CARD_W}" height="${CARD_H}" rx="8" fill="${c.bg}" stroke="${c.border}" stroke-width="1" />
${lines.join('\n')}
</svg>`;
}

export const GET: APIRoute = async ({ params }) => {
  const username = params.username;
  if (!username) {
    return new Response('Username is required', { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_URL}/api/profile/${username}`);
    if (!upstream.ok) {
      return new Response('Profile not found', { status: upstream.status });
    }

    const data = (await upstream.json()) as ProfileData;
    const svg = renderCard(username, data);

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: CARD_W },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return new Response('Failed to generate PNG', { status: 502 });
  }
};
