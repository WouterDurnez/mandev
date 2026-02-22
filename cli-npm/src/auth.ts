import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { AUTH_FILE } from "./config.js";

interface AuthData {
  access_token: string;
  token_type: string;
}

export function readToken(): string {
  if (!existsSync(AUTH_FILE)) {
    console.error("Not logged in. Run `mandev login` first.");
    process.exit(1);
  }
  const data: AuthData = JSON.parse(readFileSync(AUTH_FILE, "utf-8"));
  return data.access_token;
}

export function saveToken(data: AuthData): void {
  const dir = dirname(AUTH_FILE);
  mkdirSync(dir, { recursive: true });
  writeFileSync(AUTH_FILE, JSON.stringify(data));
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
