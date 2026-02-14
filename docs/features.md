# man.dev Feature Ideas

Feature ideas grounded in the current repository state (CLI + API + web MVP).

## 1. Career Diff Timeline

- Show profile changes as release-note-style timeline entries on public profiles.
- Add CLI support for diffing and optional human summaries.
- Example commands: `mandev diff`, `mandev changelog add "Joined Acme as Staff Engineer"`.

## 2. Importers for Fast Onboarding

- Generate a first draft config from existing sources.
- Add CLI and web entry points for imports.
- Example commands: `mandev import github`, `mandev import resume`.

## 3. Profile Linting and Suggestions

- Add quality checks for incomplete, stale, or weak profile sections.
- Provide concrete, actionable suggestions to improve profile clarity.
- Example command: `mandev doctor`.

## 4. JSON and Curl Output Formats

- Add machine-readable output via `/{username}.json`.
- Add terminal-rendered profile output for `curl man.dev/{username}`.
- Keep both outputs generated from the same canonical config model.

## 5. PDF Resume Export

- Generate print-ready resumes from the same profile data.
- Support at least ATS-safe and styled templates.
- Make export available from both CLI and web dashboard.

## 6. GitHub Stats Block

- Pull and display contribution and repository signals.
- Add cached stats pipeline to keep page loads fast and API usage controlled.
- Surface stats in public profile and dashboard.

## 7. Theme Marketplace and Presets

- Support installable community themes with metadata and previews.
- Add theme install/update workflow in CLI and dashboard.
- Example command: `mandev theme install tokyo-night-pro`.

## 8. Verified Signals

- Add account verification (GitHub ownership, domain/email verification).
- Display trust indicators on public profiles.
- Use verification status to improve profile credibility.

## 9. Profile Variants (Context-Specific Profiles)

- Support multiple profile contexts from one base config.
- Example contexts: hiring, speaking, consulting.
- Example command: `mandev push --profile hiring`.

## 10. Team Directory

- Add organization-level pages and searchable team profiles.
- Include filters for skills, role, and availability signals.
- Position this as a hosted premium/team feature.
