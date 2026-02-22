import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../loader.js";

export const exportJsonCommand = new Command("export-json")
  .description("Export the local config as canonical JSON.")
  .option("-o, --output <path>", "Write JSON to a file path.")
  .action((opts: { output?: string }) => {
    let config;
    try {
      config = loadConfig();
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }

    const payload = JSON.stringify(config, null, 2);

    if (!opts.output) {
      console.log(payload);
      return;
    }

    mkdirSync(dirname(opts.output), { recursive: true });
    writeFileSync(opts.output, payload + "\n");
    console.log(chalk.green(`Exported config JSON to ${opts.output}`));
  });
