import { Command } from "commander";
import chalk from "chalk";
import { apiPut } from "../api.js";
import { readToken } from "../auth.js";
import { loadConfig } from "../loader.js";

export const pushCommand = new Command("push")
  .description("Push the local config to man.dev.")
  .action(async () => {
    const token = readToken();

    let config;
    try {
      config = loadConfig();
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }

    const response = await apiPut("/api/profile", config, token);
    if (!response.ok) {
      console.error(chalk.red("Push failed."));
      process.exit(1);
    }

    console.log(chalk.green("Profile pushed successfully."));
  });
