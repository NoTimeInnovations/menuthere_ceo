/**
 * Explore API — Cloudflare Worker backed by D1.
 *
 * Serves the /explore page in the Menuthere CRM. The rest of the app runs on
 * Convex; only this prospecting list lives in Cloudflare (per requirement:
 * "the data ... in cloudflare only").
 *
 * Routes (all JSON, CORS-open):
 *   GET    /api/explore            -> list rows, newest first
 *   POST   /api/explore/import     -> { rows: [{name, phone, zomatoLink}] }, dedupe by link
 *   PATCH  /api/explore/:id        -> { newContact?, remark?, nextCallAt? }
 *   DELETE /api/explore/:id
 */

export interface Env {
  DB: D1Database;
}

type DbRow = {
  id: number;
  name: string;
  phone: string;
  zomato_link: string;
  new_contact: string | null;
  remark: string | null;
  next_call_at: number | null;
  created_at: number;
};

// Shape the frontend consumes (camelCase, `_id` to mirror the old Convex rows).
function toClient(r: DbRow) {
  return {
    _id: String(r.id),
    name: r.name,
    phone: r.phone,
    zomatoLink: r.zomato_link,
    newContact: r.new_contact ?? undefined,
    remark: r.remark ?? undefined,
    nextCallAt: r.next_call_at ?? undefined,
  };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, ""); // strip trailing slash

    try {
      // GET /api/explore
      if (path === "/api/explore" && request.method === "GET") {
        // Preserve the order rows were imported in — i.e. the same order as the
        // uploaded Excel sheet (id is monotonic, so ASC = insertion = sheet order).
        const { results } = await env.DB.prepare(
          "SELECT * FROM explore_restaurants ORDER BY id ASC",
        ).all<DbRow>();
        return json((results ?? []).map(toClient));
      }

      // POST /api/explore/import
      if (path === "/api/explore/import" && request.method === "POST") {
        const body = (await request.json()) as {
          rows?: { name: string; phone: string; zomatoLink: string }[];
        };
        const rows = Array.isArray(body.rows) ? body.rows : [];
        let imported = 0;
        let skipped = 0;
        // Dedupe by restaurant name (case-insensitive): a restaurant with the
        // same name — whether already in the DB or repeated within this sheet —
        // is treated as a duplicate and skipped.
        const seenNames = new Set<string>();
        const now = Date.now();

        for (const row of rows) {
          const name = String(row?.name ?? "").trim();
          if (!name) {
            skipped++;
            continue;
          }
          const nameKey = name.toLowerCase();
          if (seenNames.has(nameKey)) {
            skipped++;
            continue;
          }
          const existing = await env.DB.prepare(
            "SELECT id FROM explore_restaurants WHERE name = ? COLLATE NOCASE LIMIT 1",
          )
            .bind(name)
            .first();
          if (existing) {
            skipped++;
            continue;
          }
          seenNames.add(nameKey);

          await env.DB.prepare(
            "INSERT INTO explore_restaurants (name, phone, zomato_link, created_at) VALUES (?, ?, ?, ?)",
          )
            .bind(name, String(row?.phone ?? ""), String(row?.zomatoLink ?? "").trim(), now)
            .run();
          imported++;
        }
        return json({ imported, skipped });
      }

      // PATCH /api/explore/:id  and  DELETE /api/explore/:id
      const idMatch = path.match(/^\/api\/explore\/(\d+)$/);
      if (idMatch) {
        const id = Number(idMatch[1]);

        if (request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM explore_restaurants WHERE id = ?")
            .bind(id)
            .run();
          return json({ ok: true });
        }

        if (request.method === "PATCH") {
          const body = (await request.json()) as {
            newContact?: string;
            remark?: string;
            nextCallAt?: number | null;
          };
          const sets: string[] = [];
          const binds: (string | number | null)[] = [];
          if ("newContact" in body) {
            sets.push("new_contact = ?");
            binds.push(body.newContact ?? null);
          }
          if ("remark" in body) {
            sets.push("remark = ?");
            binds.push(body.remark ?? null);
          }
          if ("nextCallAt" in body) {
            sets.push("next_call_at = ?");
            binds.push(body.nextCallAt ?? null);
          }
          if (sets.length === 0) return json({ ok: true });
          binds.push(id);
          await env.DB.prepare(
            `UPDATE explore_restaurants SET ${sets.join(", ")} WHERE id = ?`,
          )
            .bind(...binds)
            .run();
          return json({ ok: true });
        }
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: "Internal error" }, 500);
    }
  },
};
