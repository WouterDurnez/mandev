import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../loader.js";
import { renderManPage } from "../render.js";

export const previewCommand = new Command("preview")
  .description("Render the local config as a man page in the terminal.")
  .action(() => {
    let config;
    try {
      config = loadConfig();
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }

    console.log(renderManPage(config));
  });
