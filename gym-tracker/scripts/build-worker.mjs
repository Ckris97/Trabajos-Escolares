// Genera dist/_worker.js: un solo archivo con la página, los íconos y la API.
// Se usa para publicar en Cloudflare Pages por "subida directa" sin depender
// de la subida de archivos estáticos.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json' };
const assets = {};
for (const f of readdirSync(join(root, 'public'))) {
  const t = TYPES[extname(f)]; if (!t) continue;
  assets['/' + f] = { t, b: readFileSync(join(root, 'public', f)).toString('base64') };
}
assets['/'] = assets['/index.html'];

const api = readFileSync(join(root, 'src/api.js'), 'utf8').replace(/^export /gm, '');
const out = `// Archivo generado por scripts/build-worker.mjs. No editar a mano.
${api}
const ASSETS = ${JSON.stringify(assets)};
const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url.pathname.slice(5).split('/').filter(Boolean));
    const a = ASSETS[url.pathname] || ASSETS['/'];
    return new Response(bytes(a.b), { headers: { 'content-type': a.t, 'cache-control': a.t.startsWith('text/html') ? 'no-cache' : 'public, max-age=86400' } });
  }
};
`;
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/_worker.js'), out);
console.log('dist/_worker.js', (out.length / 1024).toFixed(0) + ' KB');
