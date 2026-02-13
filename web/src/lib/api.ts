/**
 * API helper utilities for communicating with the mandev backend.
 *
 * Provides thin wrappers around ``fetch`` and localStorage-based
 * token management.
 */

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Send a POST request.
 *
 * :param path: API path (e.g. ``/api/auth/login``).
 * :param body: JSON-serialisable request body.
 * :param token: Optional bearer token.
 * :returns: The raw ``Response``.
 */
export async function apiPost(
  path: string,
  body: object,
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return res;
}

/**
 * Send a GET request.
 *
 * :param path: API path.
 * :param token: Optional bearer token.
 * :returns: The raw ``Response``.
 */
export async function apiGet(
  path: string,
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  return res;
}

/**
 * Send a PUT request.
 *
 * :param path: API path.
 * :param body: JSON-serialisable request body.
 * :param token: Optional bearer token.
 * :returns: The raw ``Response``.
 */
export async function apiPut(
  path: string,
  body: object,
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return res;
}

/**
 * Retrieve the stored auth token.
 *
 * :returns: The token string or ``null`` when absent / server-side.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mandev_token');
}

/**
 * Persist an auth token to localStorage.
 *
 * :param token: JWT access token.
 */
export function setToken(token: string): void {
  localStorage.setItem('mandev_token', token);
}

/**
 * Remove the stored auth token.
 */
export function clearToken(): void {
  localStorage.removeItem('mandev_token');
}
