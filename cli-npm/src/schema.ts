import { z } from "zod";

export const ProfileSchema = z.object({
  name: z.string(),
  tagline: z.string().nullish(),
  about: z.string().nullish(),
  avatar: z.string().nullish(),
});

export const SkillSchema = z.object({
  name: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
});

export const ProjectSchema = z.object({
  name: z.string(),
  repo: z.string().nullish(),
  url: z.string().nullish(),
  description: z.string().nullish(),
});

export const ExperienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  start: z.string(),
  end: z.string().nullish(),
  description: z.string().nullish(),
});

export const LinkSchema = z.object({
  label: z.string(),
  url: z.string(),
  icon: z.string().nullish(),
});

export const ThemeSchema = z.object({
  scheme: z.string().default("dracula"),
  font: z.string().default("JetBrains Mono"),
  mode: z.enum(["dark", "light"]).default("dark"),
  accent: z.string().nullish(),
});

export const LayoutSchema = z.object({
  sections: z
    .array(z.string())
    .default(["bio", "skills", "projects", "experience", "links"]),
});

export const GitHubSchema = z.object({
  username: z.string(),
  show_heatmap: z.boolean().default(true),
  show_stats: z.boolean().default(true),
  show_languages: z.boolean().default(true),
  show_pinned: z.boolean().default(true),
});

export const NpmSchema = z.object({
  username: z.string(),
  show_packages: z.boolean().default(true),
  show_downloads: z.boolean().default(true),
  max_packages: z.number().int().default(10),
});

export const PyPISchema = z.object({
  packages: z.array(z.string()),
  show_downloads: z.boolean().default(true),
  max_packages: z.number().int().default(10),
});

export const DevToSchema = z.object({
  username: z.string(),
  show_articles: z.boolean().default(true),
  show_stats: z.boolean().default(true),
  max_articles: z.number().int().default(5),
});

export const HashnodeSchema = z.object({
  username: z.string(),
  show_articles: z.boolean().default(true),
  max_articles: z.number().int().default(5),
});

export const MandevConfigSchema = z.object({
  profile: ProfileSchema,
  theme: ThemeSchema.default({}),
  layout: LayoutSchema.default({}),
  skills: z.array(SkillSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  experience: z.array(ExperienceSchema).default([]),
  links: z.array(LinkSchema).default([]),
  github: GitHubSchema.nullish(),
  npm: NpmSchema.nullish(),
  pypi: PyPISchema.nullish(),
  devto: DevToSchema.nullish(),
  hashnode: HashnodeSchema.nullish(),
});

export type MandevConfig = z.infer<typeof MandevConfigSchema>;
