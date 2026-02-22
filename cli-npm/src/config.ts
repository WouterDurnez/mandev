import { homedir } from "node:os";
import { join } from "node:path";

export const API_BASE_URL = "https://man.dev";
export const AUTH_FILE = join(homedir(), ".config", "mandev", "auth.json");
export const CONFIG_FILENAMES = [".mandev.toml", ".mandev.yaml", ".mandev.yml"];
