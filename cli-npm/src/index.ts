import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { loginCommand } from "./commands/login.js";
import { whoamiCommand } from "./commands/whoami.js";
import { pushCommand } from "./commands/push.js";
import { previewCommand } from "./commands/preview.js";
import { validateCommand } from "./commands/validate.js";
import { exportJsonCommand } from "./commands/export-json.js";
import { diffCommand } from "./commands/diff.js";
import { doctorCommand } from "./commands/doctor.js";

const program = new Command();

program
  .name("mandev")
  .description("man.dev CLI -- your manual, as a developer.")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(loginCommand);
program.addCommand(whoamiCommand);
program.addCommand(pushCommand);
program.addCommand(previewCommand);
program.addCommand(validateCommand);
program.addCommand(exportJsonCommand);
program.addCommand(diffCommand);
program.addCommand(doctorCommand);

program.parse();
