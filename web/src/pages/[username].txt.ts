import type { APIRoute } from 'astro';
import { ansi, bold, dim, color, boldColor, underline, isCLI } from '../lib/ansi';

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
  domain?: string;
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

interface GitHubLanguage {
  name: string;
  percentage: number;
  color: string;
}

interface GitHubRepo {
  name: string;
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  url: string;
}

interface GitHubStatsData {
  total_stars: number;
  total_repos: number;
  followers: number;
  total_contributions: number;
  current_streak: number;
  longest_streak: number;
  languages: GitHubLanguage[];
  pinned_repos: GitHubRepo[];
  contributions: { date: string; count: number }[];
}

interface GitHubConfig {
  username: string;
  show_heatmap?: boolean;
  show_stats?: boolean;
  show_languages?: boolean;
  show_pinned?: boolean;
}

interface NpmPackage {
  name: string;
  version: string;
  description: string;
  weekly_downloads: number;
}

interface NpmStats {
  total_packages: number;
  total_weekly_downloads: number;
  packages: NpmPackage[];
}

interface NpmConfig {
  username: string;
  show_packages?: boolean;
  show_downloads?: boolean;
}

interface PyPIPackage {
  name: string;
  version: string;
  description: string;
  monthly_downloads: number;
}

interface PyPIStats {
  total_packages: number;
  total_monthly_downloads: number;
  packages: PyPIPackage[];
}

interface PyPIConfig {
  packages: string[];
  show_downloads?: boolean;
}

interface DevToArticle {
  title: string;
  url: string;
  published_at: string;
  reactions: number;
  comments: number;
  reading_time: number;
  tags: string[];
}

interface DevToStats {
  total_articles: number;
  total_reactions: number;
  total_comments: number;
  articles: DevToArticle[];
}

interface DevToConfig {
  username: string;
  show_articles?: boolean;
  show_stats?: boolean;
}

interface HashnodeArticle {
  title: string;
  url: string;
  published_at: string;
  reactions: number;
}

interface HashnodeStats {
  total_articles: number;
  total_reactions: number;
  articles: HashnodeArticle[];
}

interface HashnodeConfig {
  username: string;
  show_articles?: boolean;
}

interface ProfileData {
  username?: string;
  profile?: Profile;
  skills?: Skill[];
  projects?: Project[];
  experience?: Experience[];
  links?: Link[];
  layout?: Layout;
  github?: GitHubConfig;
  github_stats?: GitHubStatsData | null;
  npm?: NpmConfig;
  npm_stats?: NpmStats | null;
  pypi?: PyPIConfig;
  pypi_stats?: PyPIStats | null;
  devto?: DevToConfig;
  devto_stats?: DevToStats | null;
  hashnode?: HashnodeConfig;
  hashnode_stats?: HashnodeStats | null;
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

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
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
      const hasDomains = data.skills.some((s) => s.domain?.trim());
      const maxNameLen = Math.max(...data.skills.map((skill) => skill.name.length));
      if (hasDomains) {
        const groups: Record<string, Skill[]> = {};
        for (const s of data.skills) {
          const d = s.domain?.trim() || 'Other';
          (groups[d] ??= []).push(s);
        }
        for (const [domain, skills] of Object.entries(groups)) {
          lines.push(`       [${domain}]`);
          for (const skill of skills) {
            const paddedName = skill.name.padEnd(maxNameLen, ' ');
            lines.push(`         ${paddedName} ${skillBar(skill.level)} ${skill.level}`);
          }
        }
      } else {
        for (const skill of data.skills) {
          const paddedName = skill.name.padEnd(maxNameLen, ' ');
          lines.push(`       ${paddedName} ${skillBar(skill.level)} ${skill.level}`);
        }
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

  const github = data.github;
  const stats = data.github_stats;
  if (stats) {
    if (github?.show_stats !== false) {
      lines.push('GITHUB');
      lines.push(`       Stars: ${stats.total_stars.toLocaleString()}  Repos: ${stats.total_repos.toLocaleString()}  Followers: ${stats.followers.toLocaleString()}  Contributions: ${stats.total_contributions.toLocaleString()}`);
      lines.push(`       Current streak: ${stats.current_streak} days  Longest: ${stats.longest_streak} days`);
      lines.push('');
    }
    if (github?.show_languages !== false && stats.languages.length > 0) {
      lines.push('LANGUAGES');
      for (const lang of stats.languages) {
        lines.push(`       ${lang.name} ${lang.percentage}%`);
      }
      lines.push('');
    }
    if (github?.show_pinned !== false && stats.pinned_repos.length > 0) {
      lines.push('PINNED REPOSITORIES');
      for (const repo of stats.pinned_repos) {
        lines.push(`       ${repo.name}  ★ ${repo.stars}  ⑂ ${repo.forks}`);
        if (repo.description) lines.push(`         ${repo.description}`);
      }
      lines.push('');
    }
  }

  // npm
  const npmCfg = data.npm;
  const npmStats = data.npm_stats;
  if (npmStats && npmCfg?.show_packages !== false && npmStats.packages.length > 0) {
    lines.push('NPM PACKAGES');
    const header = `       ${npmStats.total_packages} packages`;
    lines.push(npmCfg?.show_downloads !== false
      ? `${header} · ${fmtNum(npmStats.total_weekly_downloads)} downloads/wk`
      : header);
    for (const pkg of npmStats.packages) {
      const dl = npmCfg?.show_downloads !== false ? ` (${fmtNum(pkg.weekly_downloads)}/wk)` : '';
      lines.push(`       ${pkg.name} v${pkg.version}${dl}`);
    }
    lines.push('');
  }

  // PyPI
  const pypiCfg = data.pypi;
  const pypiStats = data.pypi_stats;
  if (pypiStats && pypiStats.packages.length > 0) {
    lines.push('PYPI PACKAGES');
    const header = `       ${pypiStats.total_packages} packages`;
    lines.push(pypiCfg?.show_downloads !== false
      ? `${header} · ${fmtNum(pypiStats.total_monthly_downloads)} downloads/mo`
      : header);
    for (const pkg of pypiStats.packages) {
      const dl = pypiCfg?.show_downloads !== false ? ` (${fmtNum(pkg.monthly_downloads)}/mo)` : '';
      lines.push(`       ${pkg.name} v${pkg.version}${dl}`);
    }
    lines.push('');
  }

  // Dev.to
  const devtoCfg = data.devto;
  const devtoStats = data.devto_stats;
  if (devtoStats && devtoCfg?.show_articles !== false && devtoStats.articles.length > 0) {
    lines.push('DEV.TO');
    if (devtoCfg?.show_stats !== false) {
      lines.push(`       ${devtoStats.total_articles} articles · ${fmtNum(devtoStats.total_reactions)} reactions · ${fmtNum(devtoStats.total_comments)} comments`);
    }
    for (const article of devtoStats.articles) {
      lines.push(`       ${article.title}  ♥ ${article.reactions}  ${article.reading_time}m`);
      lines.push(`         ${article.url}`);
    }
    lines.push('');
  }

  // Hashnode
  const hashnodeCfg = data.hashnode;
  const hashnodeStats = data.hashnode_stats;
  if (hashnodeStats && hashnodeCfg?.show_articles !== false && hashnodeStats.articles.length > 0) {
    lines.push('HASHNODE');
    lines.push(`       ${hashnodeStats.total_articles} articles · ${fmtNum(hashnodeStats.total_reactions)} reactions`);
    for (const article of hashnodeStats.articles) {
      lines.push(`       ${article.title}  ♥ ${article.reactions}`);
      lines.push(`         ${article.url}`);
    }
    lines.push('');
  }

  lines.push(`man.dev  ${new Date().getFullYear()}  ${uname}(7)`);
  lines.push('');
  return lines.join('\n');
}

const ANSI_SKILL_COLOR: Record<SkillLevel, string> = {
  expert: ansi.green,
  advanced: ansi.cyan,
  intermediate: ansi.yellow,
  beginner: ansi.gray,
};

function renderAnsiManPage(username: string, data: ProfileData): string {
  const profile = data.profile;
  if (!profile) {
    return `No manual entry for ${username}\n`;
  }

  const lines: string[] = [];
  const uname = username.toUpperCase();
  const sections = data.layout?.sections || ['bio', 'skills', 'projects', 'experience', 'links'];

  lines.push(dim(`${uname}(7)  man.dev Manual  ${uname}(7)`));
  lines.push('');

  for (const section of sections) {
    if (section === 'bio') {
      lines.push(boldColor('NAME', ansi.cyan));
      const name = bold(profile.name);
      const tagline = profile.tagline ? ` -- ${dim(profile.tagline)}` : '';
      lines.push(`       ${name}${tagline}`);
      lines.push('');
      if (profile.about) {
        lines.push(boldColor('DESCRIPTION', ansi.cyan));
        lines.push(`       ${dim(profile.about)}`);
        lines.push('');
      }
    }

    if (section === 'skills' && data.skills && data.skills.length > 0) {
      lines.push(boldColor('SKILLS', ansi.cyan));
      const hasDomains = data.skills.some((s) => s.domain?.trim());
      const maxNameLen = Math.max(...data.skills.map((skill) => skill.name.length));
      if (hasDomains) {
        const groups: Record<string, Skill[]> = {};
        for (const s of data.skills) {
          const d = s.domain?.trim() || 'Other';
          (groups[d] ??= []).push(s);
        }
        for (const [domain, skills] of Object.entries(groups)) {
          lines.push(`       ${dim(`[${domain}]`)}`);
          for (const skill of skills) {
            const paddedName = skill.name.padEnd(maxNameLen, ' ');
            const c = ANSI_SKILL_COLOR[skill.level];
            lines.push(`         ${bold(paddedName)} ${color(skillBar(skill.level), c)} ${dim(skill.level)}`);
          }
        }
      } else {
        for (const skill of data.skills) {
          const paddedName = skill.name.padEnd(maxNameLen, ' ');
          const c = ANSI_SKILL_COLOR[skill.level];
          lines.push(`       ${bold(paddedName)} ${color(skillBar(skill.level), c)} ${dim(skill.level)}`);
        }
      }
      lines.push('');
    }

    if (section === 'projects' && data.projects && data.projects.length > 0) {
      lines.push(boldColor('PROJECTS', ansi.cyan));
      for (const project of data.projects) {
        lines.push(`       ${bold(project.name)}`);
        if (project.description) lines.push(`         ${dim(project.description)}`);
        if (project.url) lines.push(`         ${underline(project.url)}`);
        if (!project.url && project.repo) lines.push(`         ${underline(project.repo)}`);
      }
      lines.push('');
    }

    if (section === 'experience' && data.experience && data.experience.length > 0) {
      lines.push(boldColor('EXPERIENCE', ansi.cyan));
      for (const exp of data.experience) {
        lines.push(`       ${bold(exp.role)} ${dim('at')} ${bold(exp.company)} ${dim(`(${exp.start}-${exp.end || 'present'})`)}`);
        if (exp.description) lines.push(`         ${dim(exp.description)}`);
      }
      lines.push('');
    }

    if (section === 'links' && data.links && data.links.length > 0) {
      lines.push(boldColor('SEE ALSO', ansi.cyan));
      for (const link of data.links) {
        lines.push(`       ${bold(link.label)}: ${underline(link.url)}`);
      }
      lines.push('');
    }
  }

  const github = data.github;
  const stats = data.github_stats;
  if (stats) {
    if (github?.show_stats !== false) {
      lines.push(boldColor('GITHUB', ansi.cyan));
      lines.push(`       ${dim('Stars:')} ${bold(stats.total_stars.toLocaleString())}  ${dim('Repos:')} ${bold(stats.total_repos.toLocaleString())}  ${dim('Followers:')} ${bold(stats.followers.toLocaleString())}  ${dim('Contributions:')} ${bold(stats.total_contributions.toLocaleString())}`);
      lines.push(`       ${dim('Current streak:')} ${bold(String(stats.current_streak))} ${dim('days')}  ${dim('Longest:')} ${bold(String(stats.longest_streak))} ${dim('days')}`);
      lines.push('');
    }
    if (github?.show_languages !== false && stats.languages.length > 0) {
      lines.push(boldColor('LANGUAGES', ansi.cyan));
      for (const lang of stats.languages) {
        lines.push(`       ${bold(lang.name)} ${dim(`${lang.percentage}%`)}`);
      }
      lines.push('');
    }
    if (github?.show_pinned !== false && stats.pinned_repos.length > 0) {
      lines.push(boldColor('PINNED REPOSITORIES', ansi.cyan));
      for (const repo of stats.pinned_repos) {
        lines.push(`       ${bold(repo.name)}  ${color(`★ ${repo.stars}`, ansi.yellow)}  ${dim(`⑂ ${repo.forks}`)}`);
        if (repo.description) lines.push(`         ${dim(repo.description)}`);
      }
      lines.push('');
    }
  }

  // npm
  const npmCfgA = data.npm;
  const npmStatsA = data.npm_stats;
  if (npmStatsA && npmCfgA?.show_packages !== false && npmStatsA.packages.length > 0) {
    lines.push(boldColor('NPM PACKAGES', ansi.cyan));
    const hdr = `${bold(String(npmStatsA.total_packages))} ${dim('packages')}`;
    lines.push(npmCfgA?.show_downloads !== false
      ? `       ${hdr} ${dim('·')} ${bold(fmtNum(npmStatsA.total_weekly_downloads))} ${dim('downloads/wk')}`
      : `       ${hdr}`);
    for (const pkg of npmStatsA.packages) {
      const dl = npmCfgA?.show_downloads !== false ? ` ${dim(`(${fmtNum(pkg.weekly_downloads)}/wk)`)}` : '';
      lines.push(`       ${bold(pkg.name)} ${dim(`v${pkg.version}`)}${dl}`);
    }
    lines.push('');
  }

  // PyPI
  const pypiCfgA = data.pypi;
  const pypiStatsA = data.pypi_stats;
  if (pypiStatsA && pypiStatsA.packages.length > 0) {
    lines.push(boldColor('PYPI PACKAGES', ansi.cyan));
    const hdr = `${bold(String(pypiStatsA.total_packages))} ${dim('packages')}`;
    lines.push(pypiCfgA?.show_downloads !== false
      ? `       ${hdr} ${dim('·')} ${bold(fmtNum(pypiStatsA.total_monthly_downloads))} ${dim('downloads/mo')}`
      : `       ${hdr}`);
    for (const pkg of pypiStatsA.packages) {
      const dl = pypiCfgA?.show_downloads !== false ? ` ${dim(`(${fmtNum(pkg.monthly_downloads)}/mo)`)}` : '';
      lines.push(`       ${bold(pkg.name)} ${dim(`v${pkg.version}`)}${dl}`);
    }
    lines.push('');
  }

  // Dev.to
  const devtoCfgA = data.devto;
  const devtoStatsA = data.devto_stats;
  if (devtoStatsA && devtoCfgA?.show_articles !== false && devtoStatsA.articles.length > 0) {
    lines.push(boldColor('DEV.TO', ansi.cyan));
    if (devtoCfgA?.show_stats !== false) {
      lines.push(`       ${bold(String(devtoStatsA.total_articles))} ${dim('articles')} ${dim('·')} ${bold(fmtNum(devtoStatsA.total_reactions))} ${dim('reactions')} ${dim('·')} ${bold(fmtNum(devtoStatsA.total_comments))} ${dim('comments')}`);
    }
    for (const article of devtoStatsA.articles) {
      lines.push(`       ${bold(article.title)}  ${color(`♥ ${article.reactions}`, ansi.yellow)}  ${dim(`${article.reading_time}m`)}`);
      lines.push(`         ${underline(article.url)}`);
    }
    lines.push('');
  }

  // Hashnode
  const hashnodeCfgA = data.hashnode;
  const hashnodeStatsA = data.hashnode_stats;
  if (hashnodeStatsA && hashnodeCfgA?.show_articles !== false && hashnodeStatsA.articles.length > 0) {
    lines.push(boldColor('HASHNODE', ansi.cyan));
    lines.push(`       ${bold(String(hashnodeStatsA.total_articles))} ${dim('articles')} ${dim('·')} ${bold(fmtNum(hashnodeStatsA.total_reactions))} ${dim('reactions')}`);
    for (const article of hashnodeStatsA.articles) {
      lines.push(`       ${bold(article.title)}  ${color(`♥ ${article.reactions}`, ansi.yellow)}`);
      lines.push(`         ${underline(article.url)}`);
    }
    lines.push('');
  }

  lines.push(dim(`man.dev  ${new Date().getFullYear()}  ${uname}(7)`));
  lines.push('');
  return lines.join('\n');
}

export const GET: APIRoute = async ({ params, request }) => {
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
    const url = new URL(request.url);
    const forcePlain = url.searchParams.has('plain');
    const useAnsi = !forcePlain && isCLI(request.headers.get('user-agent'));
    const body = useAnsi ? renderAnsiManPage(username, data) : renderManPage(username, data);

    return new Response(body, {
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
