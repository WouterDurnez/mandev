import { Command } from "commander";
import chalk from "chalk";
import { ZodError } from "zod";
import { loadConfig } from "../loader.js";

export const validateCommand = new Command("validate")
  .description("Validate the local config file against the schema.")
  .action(() => {
    try {
      loadConfig();
    } catch (err) {
      if (err instanceof ZodError) {
        console.error(chalk.red("Validation failed:"));
        for (const issue of err.issues) {
          const loc = issue.path.join(" -> ");
          console.error(`  ${loc}: ${issue.message}`);
        }
        process.exit(1);
      }
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }

    console.log(chalk.green("Config is valid."));
  });
