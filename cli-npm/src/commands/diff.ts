import { Command } from "commander";
import chalk from "chalk";
import { createTwoFilesPatch } from "diff";
import { apiGet } from "../api.js";
import { readToken } from "../auth.js";
import { loadConfig } from "../loader.js";
import { MandevConfigSchema } from "../schema.js";

export const diffCommand = new Command("diff")
  .description("Show a unified diff between remote and local profile config.")
  .action(async () => {
    const token = readToken();

    let localConfig;
    try {
      localConfig = loadConfig();
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }

    const response = await apiGet("/api/profile", token);
    if (!response.ok) {
      console.error(chalk.red("Failed to fetch remote profile."));
      process.exit(1);
    }

    let remoteConfig;
    try {
      remoteConfig = MandevConfigSchema.parse(await response.json());
    } catch {
      console.error(
        chalk.red("Remote profile is invalid and cannot be diffed.")
      );
      process.exit(1);
    }

    const sortedStringify = (obj: unknown) =>
      JSON.stringify(obj, Object.keys(obj as object).sort(), 2);

    const remoteStr = sortedStringify(remoteConfig);
    const localStr = sortedStringify(localConfig);

    if (remoteStr === localStr) {
      console.log(
        chalk.green("No differences between local and remote profile.")
      );
      return;
    }

    console.log(chalk.yellow("Differences found:"));
    const patch = createTwoFilesPatch(
      "remote",
      "local",
      remoteStr,
      localStr,
      "",
      ""
    );
    for (const line of patch.split("\n")) {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        console.log(chalk.green(line));
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        console.log(chalk.red(line));
      } else {
        console.log(line);
      }
    }
  });
