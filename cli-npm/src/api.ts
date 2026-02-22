import { API_BASE_URL } from "./config.js";

export async function apiGet(
  path: string,
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE_URL}${path}`, { headers });
}

export async function apiPost(
  path: string,
  body: unknown,
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export async function apiPut(
  path: string,
  body: unknown,
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
}
