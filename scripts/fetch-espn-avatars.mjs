/**
 * fetch-espn-avatars.mjs
 *
 * Busca fotos REAIS para TODOS os jogadores dos 48 elencos da Copa 2026,
 * dirigida pelos rosters da ESPN (liga `fifa.world`) — assim cobre as 48
 * seleções, não só as curadas localmente.
 *
 * Para cada atleta usa, nesta ordem:
 *   1. headshot da própria ESPN (quando existe)
 *   2. Wikidata/Commons (P18)  → 3. Wikipedia  → 4. TheSportsDB
 *
 * Saída: src/data/playerPhotosEspn.ts → Record<idESPN, url> (somente fotos
 * reais; quem não tem cai no monograma colorido em runtime). Resumível:
 * relê o arquivo e só busca quem ainda falta.
 *
 * Executar: node scripts/fetch-espn-avatars.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ESPN_FILE = join(ROOT, 'src', 'data', 'espnTeams.ts');
const OUTPUT_FILE = join(ROOT, 'src', 'data', 'playerPhotosEspn.ts');
const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams';

const DELAY_MS = 0;          // a concorrência já espaça as requisições
const TSDB_DELAY_MS = 700;
const MAX_RETRIES = 2;
const CONCURRENCY = 10;       // pool de workers

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const removeAccents = (s) => s.normalize('NFD').replace(/\p{Mn}/gu, '');
const toWikiSlug = (n) => n.replace(/\.\s*$/, '').replace(/\s+/g, '_');

async function fetchJson(url) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'copa-2026-build/1.0 (github.com/pocs/copa-2026)' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 429) { await sleep(5000); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (i === MAX_RETRIES - 1) return null;
      await sleep(500);
    }
  }
  return null;
}

async function isValidImageUrl(url) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//.test(url)) return false;
  try {
    const res = await fetch(url, {
      method: 'HEAD', redirect: 'follow',
      headers: { 'User-Agent': 'copa-2026-build/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    return (res.headers.get('content-type') || '').toLowerCase().includes('image');
  } catch { return false; }
}

async function pickFirstValid(urls) {
  for (const u of urls) if (await isValidImageUrl(u)) return u;
  return null;
}

/* ── Fontes ──────────────────────────────────────────────────────────────── */

async function fromWikidata(name) {
  const variants = [name, removeAccents(name), name.replace(/\./g, '').trim()]
    .filter((v, i, a) => v && a.indexOf(v) === i);
  for (const variant of variants) {
    const search = await fetchJson(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=5&search=${encodeURIComponent(variant)}`,
    );
    const ids = (search?.search ?? []).map((i) => i.id).filter(Boolean);
    if (!ids.length) continue;
    const ent = await fetchJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${encodeURIComponent(ids.join('|'))}&props=claims`,
    );
    const entities = ent?.entities ?? {};
    for (const id of ids) {
      const claim = entities[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (!claim) continue;
      // P18 sempre aponta para um arquivo real no Commons; Special:FilePath
      // redireciona para a imagem. Confiamos na URL (onError cobre exceções).
      const file = String(claim).replace(/ /g, '_');
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;
    }
  }
  return null;
}

async function fromWikipedia(name) {
  const variants = [toWikiSlug(name), toWikiSlug(removeAccents(name))]
    .filter((v, i, a) => a.indexOf(v) === i);
  for (const slug of variants) {
    const s = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`);
    if (s?.thumbnail?.source) return s.thumbnail.source;
    const q = await fetchJson(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&titles=${encodeURIComponent(slug)}`,
    );
    const page = q?.query?.pages && Object.values(q.query.pages)[0];
    const url = page?.original?.source || page?.thumbnail?.source;
    if (url) return url;
  }
  return null;
}

async function fromTheSportsDB(name) {
  const variants = [name, removeAccents(name), name.replace(/\./g, '').trim()]
    .filter((v, i, a) => a.indexOf(v) === i);
  for (const variant of variants) {
    await sleep(TSDB_DELAY_MS);
    const data = await fetchJson(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(variant)}`);
    const players = data?.player;
    if (Array.isArray(players) && players.length) {
      const candidates = players.flatMap((p) => [p?.strCutout, p?.strThumb, p?.strRender]).filter(Boolean);
      const valid = await pickFirstValid(candidates);
      if (valid) return valid;
    }
  }
  return null;
}

async function resolvePhoto(name) {
  await sleep(DELAY_MS);
  return (
    (await fromWikidata(name)) ||
    (await fromWikipedia(name)) ||
    (await fromTheSportsDB(name)) ||
    null
  );
}

/* ── IO ──────────────────────────────────────────────────────────────────── */

function loadEspnIds() {
  const src = readFileSync(ESPN_FILE, 'utf8');
  const block = src.match(/ESPN_ID_BY_CODE[^{]*\{([\s\S]*?)\}/)[1];
  return [...block.matchAll(/([A-Z]{3}):\s*'(\d+)'/g)].map((m) => ({ code: m[1], id: m[2] }));
}

function loadExisting() {
  try {
    const content = readFileSync(OUTPUT_FILE, 'utf8');
    const out = {};
    const re = /"(\d+)":\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(content))) out[m[1]] = m[2];
    return out;
  } catch { return {}; }
}

function generate(map) {
  const entries = Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([id, url]) => `  ${JSON.stringify(id)}: ${JSON.stringify(url)},`)
    .join('\n');
  return `// AUTO-GERADO por scripts/fetch-espn-avatars.mjs — não editar manualmente
// Fotos reais por ID de atleta da ESPN (liga fifa.world). Execute o script para atualizar.
export const PLAYER_PHOTOS_BY_ESPN_ID: Record<string, string> = {
${entries}
};
`;
}

/* ── Main ────────────────────────────────────────────────────────────────── */

async function main() {
  const teams = loadEspnIds();
  console.log(`📋 ${teams.length} seleções ESPN.`);

  // Coleta (id, nome) de todos os atletas + headshot da ESPN quando houver.
  const roster = [];
  for (const { code, id } of teams) {
    const r = await fetchJson(`${BASE}/${id}/roster`);
    const ath = r?.athletes ?? [];
    for (const a of ath) {
      roster.push({
        espnId: String(a.id),
        name: a.displayName || a.fullName || '',
        headshot: (a.headshot || {}).href || null,
      });
    }
    console.log(`  ${code} (${id}): ${ath.length} atletas`);
  }
  console.log(`👥 ${roster.length} atletas no total.\n`);

  const photoMap = loadExisting();
  // Aproveita headshots da ESPN de imediato.
  for (const p of roster) {
    if (!photoMap[p.espnId] && p.headshot) photoMap[p.espnId] = p.headshot;
  }

  const pending = roster.filter((p) => !photoMap[p.espnId]);
  console.log(`✔️  ${Object.keys(photoMap).length} já mapeados | buscando ${pending.length} (concorrência ${CONCURRENCY}).\n`);

  let found = 0, completed = 0, cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const p = pending[cursor++];
      const url = await resolvePhoto(p.name);
      if (url) { photoMap[p.espnId] = url; found++; }
      completed++;
      console.log(`  [${completed}/${pending.length}] ${p.name} → ${url ? '✓' : '—'}`);
      if (completed % 25 === 0) {
        writeFileSync(OUTPUT_FILE, generate(photoMap), 'utf8');
        console.log(`  💾 progresso: ${found} fotos novas | ${completed}/${pending.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  writeFileSync(OUTPUT_FILE, generate(photoMap), 'utf8');
  console.log(`\n✅ novos: ${found}/${pending.length} | total: ${Object.keys(photoMap).length}/${roster.length}`);
  console.log(`💾 ${OUTPUT_FILE}`);
}

main().catch((e) => { console.error('Erro fatal:', e); process.exit(1); });
