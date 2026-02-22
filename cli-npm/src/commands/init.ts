import { createInterface } from "node:readline/promises";
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import chalk from "chalk";

const INIT_TEMPLATE = `[profile]
name = "{name}"
tagline = "{tagline}"

[theme]
scheme = "dracula"
font = "JetBrains Mono"
mode = "dark"

[layout]
sections = ["bio", "skills", "projects", "experience", "links"]
`;

export const initCommand = new Command("init")
  .description("Scaffold a new .mandev.toml in the current directory.")
  .action(async () => {
    const configPath = join(process.cwd(), ".mandev.toml");
    if (existsSync(configPath)) {
      console.error(chalk.red(".mandev.toml already exists."));
      process.exit(1);
    }

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const name = await rl.question("Name: ");
    const tagline = await rl.question("Tagline: ");
    rl.close();

    const content = INIT_TEMPLATE.replace("{name}", name).replace(
      "{tagline}",
      tagline
    );
    writeFileSync(configPath, content);
    console.log(chalk.green(`Created .mandev.toml for ${name}`));
  });
