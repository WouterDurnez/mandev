import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse as parseToml } from "smol-toml";
import { MandevConfigSchema, type MandevConfig } from "./schema.js";
import { CONFIG_FILENAMES } from "./config.js";

export function loadConfig(directory: string = process.cwd()): MandevConfig {
  for (const filename of CONFIG_FILENAMES) {
    const filepath = join(directory, filename);
    if (existsSync(filepath)) {
      if (filename.endsWith(".yaml") || filename.endsWith(".yml")) {
        throw new Error(
          `YAML config files are not supported by the npm CLI. Convert ${filename} to .mandev.toml.`
        );
      }
      const raw = readFileSync(filepath, "utf-8");
      const data = parseToml(raw);
      return MandevConfigSchema.parse(data);
    }
  }
  throw new Error(
    `No config file found in ${directory}. Expected one of: ${CONFIG_FILENAMES.join(", ")}`
  );
}
