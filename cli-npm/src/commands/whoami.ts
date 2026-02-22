import { Command } from "commander";
import chalk from "chalk";
import { apiGet } from "../api.js";
import { readToken } from "../auth.js";

export const whoamiCommand = new Command("whoami")
  .description("Show the currently authenticated user.")
  .action(async () => {
    const token = readToken();
    const response = await apiGet("/api/auth/me", token);
    if (!response.ok) {
      console.error(chalk.red("Failed to fetch user info."));
      process.exit(1);
    }

    const data = await response.json();
    console.log(`Username: ${data.username}`);
    console.log(`Email: ${data.email}`);
  });
