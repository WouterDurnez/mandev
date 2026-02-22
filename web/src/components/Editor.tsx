import { useState, useEffect } from 'react';
import DashboardNav from './DashboardNav';
import PixelAvatar from './PixelAvatar';
import { apiGet, apiPost, apiPut, getToken } from '../lib/api';

/* ------------------------------------------------------------------ */
/*  Type definitions matching the API config schema                    */
/* ------------------------------------------------------------------ */

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  domain?: string;
}

interface Project {
  name: string;
  repo: string;
  description: string;
}

interface Experience {
  role: string;
  company: string;
  start: string;
  end: string;
  description: string;
}

interface Link {
  label: string;
  url: string;
  icon: string;
}

interface ProfileSection {
  name: string;
  tagline: string;
  about: string;
  avatar: string;
}

interface ThemeSection {
  scheme: string;
  font: string;
  mode: 'dark' | 'light';
}

interface NpmSection {
  username: string;
  show_packages: boolean;
  show_downloads: boolean;
  max_packages: number;
}

interface PyPISection {
  packages: string[];
  show_downloads: boolean;
  max_packages: number;
}

interface DevToSection {
  username: string;
  show_articles: boolean;
  show_stats: boolean;
  max_articles: number;
}

interface HashnodeSection {
  username: string;
  show_articles: boolean;
  max_articles: number;
}

interface Config {
  profile: ProfileSection;
  theme: ThemeSection;
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  links: Link[];
  layout: { sections: string[] };
  npm?: NpmSection;
  pypi?: PyPISection;
  devto?: DevToSection;
  hashnode?: HashnodeSection;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SCHEMES = [
  'dracula',
  'monokai',
  'gruvbox',
  'nord',
  'solarized-dark',
  'catppuccin',
  'tokyo-night',
  'one-dark',
  'github-dark',
  'terminal-green',
];

const FONTS = [
  'JetBrains Mono',
  'Fira Code',
  'IBM Plex Mono',
  'Inconsolata',
  'Source Code Pro',
  'Victor Mono',
  'Cascadia Code',
  'Hack',
];

const LEVELS: Skill['level'][] = ['beginner', 'intermediate', 'advanced', 'expert'];

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/* ------------------------------------------------------------------ */
/*  Shared inline styles (terminal aesthetic)                          */
/* ------------------------------------------------------------------ */

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--fg)',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  padding: '0.375rem 0.5rem',
  width: '100%',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236272a4' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
  paddingRight: '1.5rem',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '5rem',
  resize: 'vertical' as const,
};

const btnPrimary: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--accent)',
  color: 'var(--accent)',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  padding: '0.375rem 1rem',
  cursor: 'pointer',
  letterSpacing: '0.05em',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--dim)',
  fontFamily: 'inherit',
  fontSize: '0.75rem',
  padding: '0.25rem 0.5rem',
  cursor: 'pointer',
};

const btnRemove: React.CSSProperties = {
  ...btnGhost,
  color: 'var(--dim)',
  borderColor: 'var(--border)',
  padding: '0.25rem 0.5rem',
  lineHeight: 1,
};

/* ------------------------------------------------------------------ */
/*  Default empty config                                               */
/* ------------------------------------------------------------------ */

function emptyConfig(): Config {
  return {
    profile: { name: '', tagline: '', about: '', avatar: '' },
    theme: { scheme: 'dracula', font: 'JetBrains Mono', mode: 'dark' },
    skills: [],
    projects: [],
    experience: [],
    links: [],
    layout: { sections: ['bio', 'skills', 'projects', 'experience', 'links'] },
  };
}

function emptyNpm(): NpmSection {
  return { username: '', show_packages: true, show_downloads: true, max_packages: 10 };
}

function emptyPyPI(): PyPISection {
  return { packages: [], show_downloads: true, max_packages: 10 };
}

function emptyDevTo(): DevToSection {
  return { username: '', show_articles: true, show_stats: true, max_articles: 5 };
}

function emptyHashnode(): HashnodeSection {
  return { username: '', show_articles: true, max_articles: 5 };
}

/* ------------------------------------------------------------------ */
/*  Editor Component                                                   */
/* ------------------------------------------------------------------ */

/**
 * Full-page config editor for the mandev dashboard.
 *
 * Loads the authenticated user's profile on mount, presents an
 * editable form, and pushes changes back to the API.
 */
export default function Editor() {
  const [config, setConfig] = useState<Config>(emptyConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  /* ---- Mount: auth check + fetch profile ---- */
  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    apiGet('/api/profile', token)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data && data.profile) {
            const scheme = data.theme?.scheme || 'dracula';
            const font = data.theme?.font || 'JetBrains Mono';
            const mode = data.theme?.mode || 'dark';
            setConfig({
              profile: {
                name: data.profile?.name || '',
                tagline: data.profile?.tagline || '',
                about: data.profile?.about || '',
                avatar: data.profile?.avatar || '',
              },
              theme: { scheme, font, mode },
              skills: data.skills || [],
              projects: data.projects || [],
              experience: data.experience || [],
              links: data.links || [],
              layout: data.layout || {
                sections: ['bio', 'skills', 'projects', 'experience', 'links'],
              },
              npm: data.npm || undefined,
              pypi: data.pypi || undefined,
              devto: data.devto || undefined,
              hashnode: data.hashnode || undefined,
            });

            // Apply the user's saved theme to the page
            const html = document.documentElement;
            html.setAttribute('data-scheme', scheme);
            html.setAttribute('data-mode', mode);
            localStorage.setItem('mandev-mode', mode);
            html.style.fontFamily = `'${font}', monospace`;
          }
        } else if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
      })
      .catch(() => {
        setError('Failed to load profile');
      })
      .finally(() => setLoading(false));

    apiGet('/api/auth/me', token)
      .then(async (res) => {
        if (res.ok) {
          const me = await res.json();
          setGithubUsername(me.github_username || null);
          setUsername(me.username || null);
        }
      })
      .catch(() => {});
  }, []);

  /* ---- Save handler ---- */
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const res = await apiPut('/api/profile', config, token);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Save failed (${res.status})`);
      }
      setToast('Config pushed');
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  /* ---- Helpers for updating nested state ---- */
  async function handleGithubUnlink() {
    const token = getToken();
    if (!token) return;
    const res = await apiPost('/api/auth/github/unlink', {}, token);
    if (res.ok) {
      setGithubUsername(null);
    }
  }

  function updateProfile(field: keyof ProfileSection, value: string) {
    setConfig((c) => ({
      ...c,
      profile: { ...c.profile, [field]: value },
    }));
  }

  function updateTheme(field: keyof ThemeSection, value: string) {
    setConfig((c) => ({
      ...c,
      theme: { ...c.theme, [field]: value },
    }));

    // Live preview: apply theme changes to the document immediately
    const html = document.documentElement;
    if (field === 'scheme') {
      html.setAttribute('data-scheme', value);
    } else if (field === 'mode') {
      html.setAttribute('data-mode', value);
      localStorage.setItem('mandev-mode', value);
    } else if (field === 'font') {
      html.style.fontFamily = `'${value}', monospace`;
    }
  }

  function updateSkill(index: number, field: keyof Skill, value: string) {
    setConfig((c) => {
      const skills = [...c.skills];
      skills[index] = { ...skills[index], [field]: value };
      return { ...c, skills };
    });
  }

  function addSkill() {
    setConfig((c) => ({
      ...c,
      skills: [...c.skills, { name: '', level: 'intermediate', domain: '' }],
    }));
  }

  function removeSkill(index: number) {
    setConfig((c) => ({
      ...c,
      skills: c.skills.filter((_, i) => i !== index),
    }));
  }

  function updateProject(index: number, field: keyof Project, value: string) {
    setConfig((c) => {
      const projects = [...c.projects];
      projects[index] = { ...projects[index], [field]: value };
      return { ...c, projects };
    });
  }

  function addProject() {
    setConfig((c) => ({
      ...c,
      projects: [...c.projects, { name: '', repo: '', description: '' }],
    }));
  }

  function removeProject(index: number) {
    setConfig((c) => ({
      ...c,
      projects: c.projects.filter((_, i) => i !== index),
    }));
  }

  function updateExperience(index: number, field: keyof Experience, value: string) {
    setConfig((c) => {
      const experience = [...c.experience];
      experience[index] = { ...experience[index], [field]: value };
      return { ...c, experience };
    });
  }

  function addExperience() {
    setConfig((c) => ({
      ...c,
      experience: [
        ...c.experience,
        { role: '', company: '', start: '', end: '', description: '' },
      ],
    }));
  }

  function removeExperience(index: number) {
    setConfig((c) => ({
      ...c,
      experience: c.experience.filter((_, i) => i !== index),
    }));
  }

  function updateLink(index: number, field: keyof Link, value: string) {
    setConfig((c) => {
      const links = [...c.links];
      links[index] = { ...links[index], [field]: value };
      return { ...c, links };
    });
  }

  function addLink() {
    setConfig((c) => ({
      ...c,
      links: [...c.links, { label: '', url: '', icon: '' }],
    }));
  }

  function removeLink(index: number) {
    setConfig((c) => ({
      ...c,
      links: c.links.filter((_, i) => i !== index),
    }));
  }

  /* ---- Render ---- */
  if (loading) {
    return (
      <div>
        <DashboardNav active="editor" />
        <div className="max-w-terminal mx-auto px-4 py-16 text-terminal-dim font-mono text-sm">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardNav active="editor" />

      <div className="max-w-terminal mx-auto px-4 pt-16 pb-16 font-mono text-sm space-y-8">
        <pre style={{ color: 'var(--dim)' }}>$ mandev edit</pre>

        {error && (
          <p style={{ color: 'var(--accent)' }}>stderr: {error}</p>
        )}

        {/* ===== Profile Section ===== */}
        <section>
          <SectionHeader title="PROFILE" />
          <div className="pl-4 space-y-3">
            <Field label="avatar">
              <PixelAvatar
                value={config.profile.avatar}
                onChange={(dataUrl) => updateProfile('avatar', dataUrl)}
                resolution={24}
                size={96}
              />
            </Field>
            <Field label="name">
              <input
                style={inputStyle}
                value={config.profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                placeholder="Ada Lovelace"
              />
            </Field>
            <Field label="tagline">
              <input
                style={inputStyle}
                value={config.profile.tagline}
                onChange={(e) => updateProfile('tagline', e.target.value)}
                placeholder="Analytical engine whisperer"
              />
            </Field>
            <Field label="about">
              <textarea
                style={textareaStyle}
                value={config.profile.about}
                onChange={(e) => updateProfile('about', e.target.value)}
                placeholder="A brief description of yourself..."
              />
            </Field>
          </div>
        </section>

        {/* ===== Theme Section ===== */}
        <section>
          <SectionHeader title="THEME" />
          <div className="pl-4 space-y-3">
            <Field label="scheme">
              <select
                style={selectStyle}
                value={config.theme.scheme}
                onChange={(e) => updateTheme('scheme', e.target.value)}
              >
                {SCHEMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="font">
              <select
                style={selectStyle}
                value={config.theme.font}
                onChange={(e) => updateTheme('font', e.target.value)}
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="mode">
              <select
                style={selectStyle}
                value={config.theme.mode}
                onChange={(e) => updateTheme('mode', e.target.value)}
              >
                <option value="dark">dark</option>
                <option value="light">light</option>
              </select>
            </Field>
          </div>
        </section>

        {/* ===== Skills Section ===== */}
        <section>
          <SectionHeader title="SKILLS" />
          <div className="pl-4 space-y-3">
            {config.skills.map((skill, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 flex gap-2">
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={skill.name}
                    onChange={(e) => updateSkill(i, 'name', e.target.value)}
                    placeholder="Skill name"
                  />
                  <input
                    style={{ ...inputStyle, width: '8rem', flex: 'none' }}
                    value={skill.domain || ''}
                    onChange={(e) => updateSkill(i, 'domain', e.target.value)}
                    placeholder="Domain"
                  />
                  <select
                    style={{ ...selectStyle, width: 'auto', minWidth: '10rem' }}
                    value={skill.level}
                    onChange={(e) => updateSkill(i, 'level', e.target.value)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <button style={btnRemove} onClick={() => removeSkill(i)}>
                  [ x ]
                </button>
              </div>
            ))}
            <button style={btnGhost} onClick={addSkill}>
              [ + ADD SKILL ]
            </button>
          </div>
        </section>

        {/* ===== Projects Section ===== */}
        <section>
          <SectionHeader title="PROJECTS" />
          <div className="pl-4 space-y-4">
            {config.projects.map((project, i) => (
              <div
                key={i}
                className="space-y-2"
                style={{ borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--dim)' }}>project[{i}]</span>
                  <button style={btnRemove} onClick={() => removeProject(i)}>
                    [ x ]
                  </button>
                </div>
                <input
                  style={inputStyle}
                  value={project.name}
                  onChange={(e) => updateProject(i, 'name', e.target.value)}
                  placeholder="Project name"
                />
                <input
                  style={inputStyle}
                  value={project.repo}
                  onChange={(e) => updateProject(i, 'repo', e.target.value)}
                  placeholder="https://github.com/you/project"
                />
                <input
                  style={inputStyle}
                  value={project.description}
                  onChange={(e) => updateProject(i, 'description', e.target.value)}
                  placeholder="A brief description"
                />
              </div>
            ))}
            <button style={btnGhost} onClick={addProject}>
              [ + ADD PROJECT ]
            </button>
          </div>
        </section>

        {/* ===== Experience Section ===== */}
        <section>
          <SectionHeader title="EXPERIENCE" />
          <div className="pl-4 space-y-4">
            {config.experience.map((exp, i) => (
              <div
                key={i}
                className="space-y-2"
                style={{ borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--dim)' }}>experience[{i}]</span>
                  <button style={btnRemove} onClick={() => removeExperience(i)}>
                    [ x ]
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={exp.role}
                    onChange={(e) => updateExperience(i, 'role', e.target.value)}
                    placeholder="Role"
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={exp.company}
                    onChange={(e) => updateExperience(i, 'company', e.target.value)}
                    placeholder="Company"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={exp.start}
                    onChange={(e) => updateExperience(i, 'start', e.target.value)}
                    placeholder="2024-01"
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={exp.end}
                    onChange={(e) => updateExperience(i, 'end', e.target.value)}
                    placeholder="present"
                  />
                </div>
                <input
                  style={inputStyle}
                  value={exp.description}
                  onChange={(e) => updateExperience(i, 'description', e.target.value)}
                  placeholder="Description"
                />
              </div>
            ))}
            <button style={btnGhost} onClick={addExperience}>
              [ + ADD EXPERIENCE ]
            </button>
          </div>
        </section>

        {/* ===== Links Section ===== */}
        <section>
          <SectionHeader title="LINKS" />
          <div className="pl-4 space-y-3">
            {config.links.map((link, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 flex gap-2">
                  <input
                    style={{ ...inputStyle, width: '8rem', flex: 'none' }}
                    value={link.label}
                    onChange={(e) => updateLink(i, 'label', e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={link.url}
                    onChange={(e) => updateLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                  <input
                    style={{ ...inputStyle, width: '6rem', flex: 'none' }}
                    value={link.icon}
                    onChange={(e) => updateLink(i, 'icon', e.target.value)}
                    placeholder="icon"
                  />
                </div>
                <button style={btnRemove} onClick={() => removeLink(i)}>
                  [ x ]
                </button>
              </div>
            ))}
            <button style={btnGhost} onClick={addLink}>
              [ + ADD LINK ]
            </button>
          </div>
        </section>

        {/* ===== Integrations Group ===== */}
        <div
          className="space-y-6 pt-4"
          style={{ borderTop: '1px dashed var(--border)' }}
        >
          <h2
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--dim)' }}
          >
            -- INTEGRATIONS --
          </h2>

          {/* GitHub */}
          <section>
            <SectionHeader title="GITHUB" />
            <div className="pl-4 space-y-3">
              {githubUsername ? (
                <div className="flex items-center gap-3">
                  <span style={{ color: 'var(--fg)' }}>
                    Connected as <span style={{ color: 'var(--accent)' }}>@{githubUsername}</span>
                  </span>
                  <button style={btnGhost} onClick={handleGithubUnlink}>
                    [ UNLINK ]
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--dim)' }} className="mb-2">
                    Link your GitHub account to get a verified badge on your profile.
                  </p>
                  <a
                    href={`${API_URL}/api/auth/github?token=${getToken()}`}
                    style={{
                      ...btnPrimary,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    [ LINK GITHUB ]
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* npm */}
          <section>
            <SectionHeader title="NPM" />
            <div className="pl-4 space-y-3">
              {config.npm ? (
                <>
                  <Field label="username">
                    <input
                      style={inputStyle}
                      value={config.npm.username}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          npm: { ...(c.npm || emptyNpm()), username: e.target.value },
                        }))
                      }
                      placeholder="npm-username"
                    />
                  </Field>
                  <button
                    style={btnGhost}
                    onClick={() => setConfig((c) => ({ ...c, npm: undefined }))}
                  >
                    [ REMOVE npm ]
                  </button>
                </>
              ) : (
                <button
                  style={btnGhost}
                  onClick={() => setConfig((c) => ({ ...c, npm: emptyNpm() }))}
                >
                  [ + ENABLE npm ]
                </button>
              )}
            </div>
          </section>

          {/* PyPI */}
          <section>
            <SectionHeader title="PYPI" />
            <div className="pl-4 space-y-3">
              {config.pypi ? (
                <>
                  <Field label="packages">
                    <div className="space-y-2">
                      {config.pypi.packages.map((pkg, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            style={{ ...inputStyle, flex: 1 }}
                            value={pkg}
                            onChange={(e) =>
                              setConfig((c) => {
                                const pkgs = [...(c.pypi?.packages || [])];
                                pkgs[i] = e.target.value;
                                return { ...c, pypi: { ...(c.pypi || emptyPyPI()), packages: pkgs } };
                              })
                            }
                            placeholder="package-name"
                          />
                          <button
                            style={btnRemove}
                            onClick={() =>
                              setConfig((c) => ({
                                ...c,
                                pypi: {
                                  ...(c.pypi || emptyPyPI()),
                                  packages: (c.pypi?.packages || []).filter((_, j) => j !== i),
                                },
                              }))
                            }
                          >
                            [ x ]
                          </button>
                        </div>
                      ))}
                      <button
                        style={btnGhost}
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            pypi: {
                              ...(c.pypi || emptyPyPI()),
                              packages: [...(c.pypi?.packages || []), ''],
                            },
                          }))
                        }
                      >
                        [ + ADD PACKAGE ]
                      </button>
                    </div>
                  </Field>
                  <button
                    style={btnGhost}
                    onClick={() => setConfig((c) => ({ ...c, pypi: undefined }))}
                  >
                    [ REMOVE PyPI ]
                  </button>
                </>
              ) : (
                <button
                  style={btnGhost}
                  onClick={() => setConfig((c) => ({ ...c, pypi: emptyPyPI() }))}
                >
                  [ + ENABLE PyPI ]
                </button>
              )}
            </div>
          </section>

          {/* Dev.to */}
          <section>
            <SectionHeader title="DEV.TO" />
            <div className="pl-4 space-y-3">
              {config.devto ? (
                <>
                  <Field label="username">
                    <input
                      style={inputStyle}
                      value={config.devto.username}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          devto: { ...(c.devto || emptyDevTo()), username: e.target.value },
                        }))
                      }
                      placeholder="devto-username"
                    />
                  </Field>
                  <button
                    style={btnGhost}
                    onClick={() => setConfig((c) => ({ ...c, devto: undefined }))}
                  >
                    [ REMOVE Dev.to ]
                  </button>
                </>
              ) : (
                <button
                  style={btnGhost}
                  onClick={() => setConfig((c) => ({ ...c, devto: emptyDevTo() }))}
                >
                  [ + ENABLE Dev.to ]
                </button>
              )}
            </div>
          </section>

          {/* Hashnode */}
          <section>
            <SectionHeader title="HASHNODE" />
            <div className="pl-4 space-y-3">
              {config.hashnode ? (
                <>
                  <Field label="username">
                    <input
                      style={inputStyle}
                      value={config.hashnode.username}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          hashnode: { ...(c.hashnode || emptyHashnode()), username: e.target.value },
                        }))
                      }
                      placeholder="hashnode-username"
                    />
                  </Field>
                  <button
                    style={btnGhost}
                    onClick={() => setConfig((c) => ({ ...c, hashnode: undefined }))}
                  >
                    [ REMOVE Hashnode ]
                  </button>
                </>
              ) : (
                <button
                  style={btnGhost}
                  onClick={() => setConfig((c) => ({ ...c, hashnode: emptyHashnode() }))}
                >
                  [ + ENABLE Hashnode ]
                </button>
              )}
            </div>
          </section>
        </div>

        {/* ===== Save ===== */}
        <div className="flex items-center gap-4 pt-4">
          <button
            style={btnPrimary}
            onClick={handleSave}
            disabled={saving}
          >
            [ {saving ? 'PUSHING...' : 'PUSH'} ]
          </button>
          {username && (
            <a
              href={`/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...btnGhost,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              [ VIEW PROFILE ]
            </a>
          )}
        </div>
      </div>

      {/* ===== Toast ===== */}
      {toast && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 font-mono text-sm px-4 py-2"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
          }}
        >
          &gt; {toast}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/**
 * Terminal-styled section header.
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      className="text-xs uppercase tracking-widest mb-3"
      style={{ color: 'var(--accent)' }}
    >
      {title}
    </h2>
  );
}

/**
 * Labelled field wrapper for the editor form.
 */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-xs mb-1"
        style={{ color: 'var(--dim)' }}
      >
        {label}:
      </label>
      {children}
    </div>
  );
}
