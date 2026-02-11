export interface User {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro";
  createdAt: string;
}

export interface DevProfile {
  id: string;
  userId: string;
  username: string; // man.dev/username
  displayName: string;
  title: string; // "Full Stack Developer"
  bio: string;
  avatarUrl: string;
  githubUsername: string;
  techStack: string[];
  links: ProfileLink[];
  projects: Project[];
  endorsements: Endorsement[];
  theme: DevTheme;
  openToWork: boolean;
  availableFrom?: string; // ISO date string, e.g. "2024-03-01"
  workPreference?: "full-time" | "part-time" | "freelance" | "contract";
  published: boolean;
  views: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileLink {
  id: string;
  profileId: string;
  title: string;
  url: string;
  icon?: string;
  enabled: boolean;
  clicks: number;
  position: number;
}

export interface Project {
  id: string;
  profileId: string;
  name: string;
  description: string;
  url: string;
  language?: string;
  stars?: number;
  position: number;
}

export interface DevTheme {
  id: string;
  name: string;
  background: string;
  cardBackground: string;
  textColor: string;
  accentColor: string;
  buttonStyle: "filled" | "outline" | "subtle";
  borderRadius: number;
  fontFamily: string;
  isMonospace: boolean;
}

export const TECH_STACK_OPTIONS = [
  "JavaScript", "TypeScript", "Python", "Rust", "Go", "Java", "C#", "C++",
  "Ruby", "PHP", "Swift", "Kotlin", "Elixir", "Haskell", "Scala", "Zig",
  "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "Astro", "Remix",
  "Node.js", "Deno", "Bun", "Django", "FastAPI", "Rails", "Laravel", "Spring",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Supabase", "Firebase",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Cloudflare", "Vercel",
  "Git", "Linux", "Vim", "Neovim", "VS Code", "Figma", "Tailwind", "GraphQL",
  "REST", "gRPC", "WebSockets", "Terraform", "Ansible", "CI/CD",
];

export const DEFAULT_THEMES: DevTheme[] = [
  {
    id: "terminal",
    name: "Terminal",
    background: "#0a0a0a",
    cardBackground: "rgba(0, 255, 65, 0.06)",
    textColor: "#00ff41",
    accentColor: "#00ff41",
    buttonStyle: "outline",
    borderRadius: 0,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    isMonospace: true,
  },
  {
    id: "vscode-dark",
    name: "VS Code Dark",
    background: "#1e1e1e",
    cardBackground: "#252526",
    textColor: "#d4d4d4",
    accentColor: "#569cd6",
    buttonStyle: "filled",
    borderRadius: 6,
    fontFamily: "'Inter', sans-serif",
    isMonospace: false,
  },
  {
    id: "dracula",
    name: "Dracula",
    background: "#282a36",
    cardBackground: "#44475a",
    textColor: "#f8f8f2",
    accentColor: "#bd93f9",
    buttonStyle: "filled",
    borderRadius: 12,
    fontFamily: "'Inter', sans-serif",
    isMonospace: false,
  },
  {
    id: "nord",
    name: "Nord",
    background: "#2e3440",
    cardBackground: "#3b4252",
    textColor: "#eceff4",
    accentColor: "#88c0d0",
    buttonStyle: "filled",
    borderRadius: 8,
    fontFamily: "'Inter', sans-serif",
    isMonospace: false,
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    background: "#0d1117",
    cardBackground: "#161b22",
    textColor: "#e6edf3",
    accentColor: "#58a6ff",
    buttonStyle: "filled",
    borderRadius: 6,
    fontFamily: "'Inter', sans-serif",
    isMonospace: false,
  },
  {
    id: "solarized",
    name: "Solarized",
    background: "#002b36",
    cardBackground: "#073642",
    textColor: "#839496",
    accentColor: "#b58900",
    buttonStyle: "outline",
    borderRadius: 4,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    isMonospace: true,
  },
];

export interface Endorsement {
  id: string;
  profileId: string;
  authorName: string;
  authorTitle: string;
  authorUsername?: string; // if they have a man.dev profile
  text: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
