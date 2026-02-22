import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../loader.js";
import { runDoctorChecks } from "../doctor.js";

export const doctorCommand = new Command("doctor")
  .description("Run profile quality checks and suggest improvements.")
  .action(() => {
    let config;
    try {
      config = loadConfig();
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }

    const { findings, suggestions } = runDoctorChecks(config);

    if (findings.length > 0) {
      console.log(chalk.yellow("Doctor found profile issues:"));
      for (const finding of findings) {
        console.log(`  - ${finding}`);
      }
      console.log();
      console.log(chalk.cyan("Suggestions:"));
      for (const suggestion of suggestions) {
        console.log(`  - ${suggestion}`);
      }
      process.exit(1);
    }

    console.log(
      chalk.green("Doctor check passed. Profile quality looks good.")
    );
  });
