import type { APIRoute } from 'astro';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface Profile {
  name: string;
  tagline?: string;
  about?: string;
}

interface Skill {
  name: string;
  level: SkillLevel;
}

interface Project {
  name: string;
  description?: string;
  url?: string;
  repo?: string;
}

interface Experience {
  role: string;
  company: string;
  start: string;
  end?: string;
  description?: string;
}

interface Link {
  label: string;
  url: string;
}

interface Layout {
  sections?: string[];
}

interface ProfileData {
  username?: string;
  profile?: Profile;
  skills?: Skill[];
  projects?: Project[];
  experience?: Experience[];
  links?: Link[];
  layout?: Layout;
}

const BAR_WIDTH = 20;
const fillMap: Record<SkillLevel, number> = {
  beginner: 0.25,
  intermediate: 0.5,
  advanced: 0.75,
  expert: 1,
};

function skillBar(level: SkillLevel): string {
  const fill = Math.round(BAR_WIDTH * fillMap[level]);
  return `${'█'.repeat(fill)}${'░'.repeat(BAR_WIDTH - fill)}`;
}

function renderManPage(username: string, data: ProfileData): string {
  const profile = data.profile;
  if (!profile) {
    return `No manual entry for ${username}\n`;
  }

  const lines: string[] = [];
  const uname = username.toUpperCase();
  const sections = data.layout?.sections || ['bio', 'skills', 'projects', 'experience', 'links'];

  lines.push(`${uname}(7)  man.dev Manual  ${uname}(7)`);
  lines.push('');

  for (const section of sections) {
    if (section === 'bio') {
      lines.push('NAME');
      lines.push(`       ${profile.name}${profile.tagline ? ` -- ${profile.tagline}` : ''}`);
      lines.push('');
      if (profile.about) {
        lines.push('DESCRIPTION');
        lines.push(`       ${profile.about}`);
        lines.push('');
      }
    }

    if (section === 'skills' && data.skills && data.skills.length > 0) {
      lines.push('SKILLS');
      const maxNameLen = Math.max(...data.skills.map((skill) => skill.name.length));
      for (const skill of data.skills) {
        const paddedName = skill.name.padEnd(maxNameLen, ' ');
        lines.push(`       ${paddedName} ${skillBar(skill.level)} ${skill.level}`);
      }
      lines.push('');
    }

    if (section === 'projects' && data.projects && data.projects.length > 0) {
      lines.push('PROJECTS');
      for (const project of data.projects) {
        lines.push(`       ${project.name}`);
        if (project.description) lines.push(`         ${project.description}`);
        if (project.url) lines.push(`         ${project.url}`);
        if (!project.url && project.repo) lines.push(`         ${project.repo}`);
      }
      lines.push('');
    }

    if (section === 'experience' && data.experience && data.experience.length > 0) {
      lines.push('EXPERIENCE');
      for (const exp of data.experience) {
        lines.push(`       ${exp.role} at ${exp.company} (${exp.start}-${exp.end || 'present'})`);
        if (exp.description) lines.push(`         ${exp.description}`);
      }
      lines.push('');
    }

    if (section === 'links' && data.links && data.links.length > 0) {
      lines.push('SEE ALSO');
      for (const link of data.links) {
        lines.push(`       ${link.label}: ${link.url}`);
      }
      lines.push('');
    }
  }

  lines.push(`man.dev  ${new Date().getFullYear()}  ${uname}(7)`);
  lines.push('');
  return lines.join('\n');
}

export const GET: APIRoute = async ({ params }) => {
  const username = params.username;
  if (!username) {
    return new Response('Username is required\n', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const upstream = await fetch(`${API_URL}/api/profile/${username}`);
    if (!upstream.ok) {
      return new Response(`No manual entry for ${username}\n`, {
        status: upstream.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const data = (await upstream.json()) as ProfileData;
    return new Response(renderManPage(username, data), {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response('Upstream profile service unavailable\n', {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
};
