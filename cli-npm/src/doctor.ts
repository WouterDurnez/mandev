import type { MandevConfig } from "./schema.js";

export interface DoctorResult {
  findings: string[];
  suggestions: string[];
}

export function runDoctorChecks(config: MandevConfig): DoctorResult {
  const findings: string[] = [];
  const suggestions: string[] = [];

  if (!config.profile.about) {
    findings.push("Missing profile.about");
    suggestions.push("Add a concise bio describing your focus and outcomes.");
  } else if (config.profile.about.trim().length < 60) {
    findings.push("profile.about is very short");
    suggestions.push("Expand your bio with concrete impact and domain context.");
  }

  if (config.skills.length === 0) {
    findings.push("No skills listed");
    suggestions.push("Add 3-8 skills to improve discoverability.");
  }

  if (config.projects.length === 0) {
    findings.push("No projects listed");
    suggestions.push("Add at least one project with links and outcomes.");
  } else {
    const missing = config.projects.filter((p) => !p.description).length;
    if (missing) {
      findings.push(`${missing} project(s) missing descriptions`);
      suggestions.push("Add short, result-focused descriptions for each project.");
    }
  }

  if (config.links.length === 0) {
    findings.push("No links listed");
    suggestions.push("Add at least GitHub and one contact/personal link.");
  }

  const dateRe = /^\d{4}-\d{2}$/;
  let invalidDates = 0;
  for (const exp of config.experience) {
    if (!dateRe.test(exp.start)) invalidDates++;
    if (exp.end && exp.end !== "present" && !dateRe.test(exp.end)) invalidDates++;
  }
  if (invalidDates) {
    findings.push(`${invalidDates} experience date value(s) are not YYYY-MM`);
    suggestions.push("Use YYYY-MM format for experience start/end values.");
  }

  return { findings, suggestions };
}
