/**
 * Cloudflare Worker — proxy de placares ao vivo da Copa 2026.
 *
 * Por que existe:
 *   - O app é 100% estático (Vite + GitHub Pages). Chamar a API de futebol
 *     direto do browser falha por CORS e exporia a chave. Este Worker fica no
 *     meio: guarda a chave, resolve CORS e cacheia a resposta por ~60s para
 *     respeitar o limite do free tier (football-data.org: 10 req/min).
 *
 * Provider atual: football-data.org, competição `WC` (Copa do Mundo).
 *   Para trocar de provedor (ex.: plano pago com live minuto-a-minuto), basta
 *   reescrever fetchUpstream()/normalize() — o formato devolvido ao app não muda.
 *
 * Contrato devolvido ao app (GET /):
 *   {
 *     updatedAt: "<ISO>",                // quando o Worker buscou
 *     matches: [{
 *       utcDate:  "2026-06-12T19:00:00Z",
 *       status:   "SCHEDULED|IN_PLAY|PAUSED|FINISHED|...",
 *       homeCode: "CAN", awayCode: "BIH",     // sigla 3 letras (FIFA/tla)
 *       homeName: "Canada", awayName: "...",
 *       home: 0, away: 0,                      // null se ainda não começou
 *       minute: 67 | null
 *     }]
 *   }
 *
 * Secret necessário:  wrangler secret put FOOTBALL_DATA_TOKEN
 * Var opcional:       ALLOWED_ORIGIN (default "*")  — origem do app p/ CORS.
 */

const UPSTREAM_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const CACHE_TTL_SECONDS = 60;

export default {
  async fetch(request, env, ctx) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'GET') {
      return json({ error: 'method not allowed' }, 405, corsHeaders);
    }
    if (!env.FOOTBALL_DATA_TOKEN) {
      return json({ error: 'FOOTBALL_DATA_TOKEN não configurado' }, 500, corsHeaders);
    }

    // Cache de borda: serve a mesma resposta por CACHE_TTL_SECONDS.
    const cache = caches.default;
    const cacheKey = new Request(new URL('/v1/live', request.url).toString(), { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) {
      return withCors(cached, corsHeaders);
    }

    let payload;
    try {
      const upstream = await fetchUpstream(env.FOOTBALL_DATA_TOKEN);
      payload = normalize(upstream);
    } catch (err) {
      return json({ error: 'upstream indisponível', detail: String(err) }, 502, corsHeaders);
    }

    const response = json(payload, 200, {
      ...corsHeaders,
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
    });
    // grava no cache de borda sem bloquear a resposta
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};

async function fetchUpstream(token) {
  const res = await fetch(UPSTREAM_URL, {
    headers: { 'X-Auth-Token': token },
    // a própria CDN da Cloudflare também guarda por 60s
    cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true },
  });
  if (!res.ok) {
    throw new Error(`football-data.org HTTP ${res.status}`);
  }
  return res.json();
}

function normalize(data) {
  const matches = Array.isArray(data?.matches) ? data.matches : [];
  return {
    updatedAt: new Date().toISOString(),
    matches: matches.map((m) => ({
      utcDate: m.utcDate,
      status: m.status,
      homeCode: m.homeTeam?.tla ?? null,
      awayCode: m.awayTeam?.tla ?? null,
      homeName: m.homeTeam?.name ?? m.homeTeam?.shortName ?? null,
      awayName: m.awayTeam?.name ?? m.awayTeam?.shortName ?? null,
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
      minute: typeof m.minute === 'number' ? m.minute : null,
    })),
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

function withCors(response, corsHeaders) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(corsHeaders)) r.headers.set(k, v);
  return r;
}
