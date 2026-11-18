// API de la Bitácora de Gym (Cloudflare Pages Functions + D1)
//
// Cada perfil se guarda como un documento JSON en la tabla `profiles`.
// Los teléfonos sincronizan perfil por perfil con control de versión
// (`updated_at`): si alguien más guardó una versión más nueva, la API
// responde 409 con esa versión y el teléfono la combina antes de reintentar.
//
// Rutas:
//   GET    /api/state            → todos los perfiles
//   PUT    /api/profiles/:id     → guarda un perfil  { data, base }
//   DELETE /api/profiles/:id     → marca un perfil como eliminado
//
// Variables del proyecto en Cloudflare:
//   DB       (binding D1, obligatorio)
//   APP_PIN  (opcional) si existe, cada petición debe mandar el header X-Pin

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

let ready = false;
async function ensureSchema(db) {
  if (ready) return;
  await db.exec(
    'CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0)'
  );
  ready = true;
}

const MAX_BYTES = 1_900_000; // por perfil; D1 admite filas de hasta 2 MB

export async function onRequest({ request, env, params }) {
  if (!env.DB) return json({ error: 'no-db', message: 'Falta el binding D1 "DB" en el proyecto de Cloudflare.' }, 503);

  if (env.APP_PIN && request.headers.get('x-pin') !== String(env.APP_PIN)) {
    return json({ error: 'pin', message: 'PIN incorrecto.' }, 401);
  }

  await ensureSchema(env.DB);
  const path = params.path || [];
  const method = request.method;

  if (path[0] === 'state' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, data, updated_at, deleted FROM profiles').all();
    return json({
      now: Date.now(),
      profiles: results.map(r => ({ id: r.id, updated_at: r.updated_at, deleted: !!r.deleted, data: r.deleted ? null : JSON.parse(r.data) })),
    });
  }

  if (path[0] === 'profiles' && path[1]) {
    const id = String(path[1]).slice(0, 64);
    const row = await env.DB.prepare('SELECT data, updated_at, deleted FROM profiles WHERE id = ?').bind(id).first();

    if (method === 'PUT') {
      const text = await request.text();
      if (text.length > MAX_BYTES) return json({ error: 'too-big', message: 'El perfil es demasiado grande.' }, 413);
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: 'bad-json' }, 400); }
      if (!body || typeof body.data !== 'object' || body.data === null || body.data.id !== id) return json({ error: 'bad-body' }, 400);
      const base = Number(body.base) || 0;
      if (row && row.updated_at > base) {
        return json({ error: 'conflict', updated_at: row.updated_at, deleted: !!row.deleted, data: row.deleted ? null : JSON.parse(row.data) }, 409);
      }
      const now = Math.max(Date.now(), (row?.updated_at || 0) + 1);
      await env.DB.prepare(
        'INSERT INTO profiles (id, data, updated_at, deleted) VALUES (?1, ?2, ?3, 0) ON CONFLICT(id) DO UPDATE SET data = ?2, updated_at = ?3, deleted = 0'
      ).bind(id, JSON.stringify(body.data), now).run();
      return json({ ok: true, updated_at: now });
    }

    if (method === 'DELETE') {
      const now = Math.max(Date.now(), (row?.updated_at || 0) + 1);
      await env.DB.prepare(
        "INSERT INTO profiles (id, data, updated_at, deleted) VALUES (?1, '{}', ?2, 1) ON CONFLICT(id) DO UPDATE SET data = '{}', updated_at = ?2, deleted = 1"
      ).bind(id, now).run();
      return json({ ok: true, updated_at: now });
    }
  }

  return json({ error: 'not-found' }, 404);
}
