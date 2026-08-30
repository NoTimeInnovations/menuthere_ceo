// Client for the Explore backend — a Cloudflare Worker + D1 (this feature's data
// lives in Cloudflare only, not Convex). In dev, requests go to /api which Vite
// proxies to `wrangler dev`. Override with VITE_EXPLORE_API in production.

export type ExploreRow = {
  _id: string;
  name: string;
  phone: string;
  zomatoLink: string;
  newContact?: string;
  remark?: string;
  nextCallAt?: number;
};

export type ImportResult = { imported: number; skipped: number };

const BASE =
  (import.meta.env.VITE_EXPLORE_API as string | undefined)?.replace(
    /\/+$/,
    "",
  ) || "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function listExplore(): Promise<ExploreRow[]> {
  return req<ExploreRow[]>("/explore");
}

export function importExplore(
  rows: { name: string; phone: string; zomatoLink: string }[],
): Promise<ImportResult> {
  return req<ImportResult>("/explore/import", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}

export function updateExplore(
  id: string,
  fields: { newContact?: string; remark?: string; nextCallAt?: number | null },
): Promise<{ ok: true }> {
  return req<{ ok: true }>(`/explore/${id}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

export function removeExplore(id: string): Promise<{ ok: true }> {
  return req<{ ok: true }>(`/explore/${id}`, { method: "DELETE" });
}
