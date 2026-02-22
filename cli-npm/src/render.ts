import type { MandevConfig } from "./schema.js";

const LEVEL_BARS: Record<string, string> = {
  beginner: "\u2588".repeat(5) + "\u2591".repeat(15),
  intermediate: "\u2588".repeat(10) + "\u2591".repeat(10),
  advanced: "\u2588".repeat(15) + "\u2591".repeat(5),
  expert: "\u2588".repeat(20),
};

export function renderManPage(config: MandevConfig): string {
  const lines: string[] = [];

  const username = config.profile.name.toUpperCase().replace(/ /g, "");
  const center = "man.dev Manual".padStart(27).padEnd(40);
  lines.push(`${username}(7)${center}${username}(7)`);
  lines.push("");

  // NAME
  lines.push("NAME");
  const tagline = config.profile.tagline ? ` -- ${config.profile.tagline}` : "";
  lines.push(`       ${config.profile.name}${tagline}`);
  lines.push("");

  // DESCRIPTION
  if (config.profile.about) {
    lines.push("DESCRIPTION");
    lines.push(`       ${config.profile.about}`);
    lines.push("");
  }

  // SKILLS
  if (config.skills.length > 0) {
    lines.push("SKILLS");
    const maxLen = Math.max(...config.skills.map((s) => s.name.length));
    for (const skill of config.skills) {
      const bar = LEVEL_BARS[skill.level];
      const padded = skill.name.padEnd(maxLen);
      lines.push(`       ${padded} ${bar} ${skill.level}`);
    }
    lines.push("");
  }

  // PROJECTS
  if (config.projects.length > 0) {
    lines.push("PROJECTS");
    for (const proj of config.projects) {
      const desc = proj.description ? `  ${proj.description}` : "";
      lines.push(`       ${proj.name}${desc}`);
    }
    lines.push("");
  }

  // EXPERIENCE
  if (config.experience.length > 0) {
    lines.push("EXPERIENCE");
    for (const exp of config.experience) {
      const end = exp.end || "present";
      lines.push(`       ${exp.role} at ${exp.company} (${exp.start}\u2013${end})`);
    }
    lines.push("");
  }

  // SEE ALSO
  if (config.links.length > 0) {
    lines.push("SEE ALSO");
    for (const link of config.links) {
      lines.push(`       ${link.label}: ${link.url}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
