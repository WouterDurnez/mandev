import { createInterface } from "node:readline/promises";
import { Command } from "commander";
import chalk from "chalk";
import { apiPost } from "../api.js";
import { saveToken } from "../auth.js";

export const loginCommand = new Command("login")
  .description("Authenticate with man.dev and save a JWT locally.")
  .action(async () => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const email = await rl.question("Email: ");

    // Hide password input
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.isTTY) stdin.setRawMode(true);

    process.stdout.write("Password: ");
    let password = "";
    await new Promise<void>((resolve) => {
      const onData = (ch: Buffer) => {
        const c = ch.toString();
        if (c === "\n" || c === "\r") {
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve();
        } else if (c === "\u007f" || c === "\b") {
          if (password.length > 0) password = password.slice(0, -1);
        } else if (c === "\u0003") {
          // Ctrl+C
          process.exit(1);
        } else {
          password += c;
        }
      };
      stdin.on("data", onData);
    });

    if (stdin.isTTY && wasRaw !== undefined) stdin.setRawMode(wasRaw);
    rl.close();

    const response = await apiPost("/api/auth/login", { email, password });
    if (!response.ok) {
      console.error(chalk.red("Login failed."));
      process.exit(1);
    }

    const data = await response.json();
    saveToken(data);
    console.log(chalk.green("Logged in successfully."));
  });
