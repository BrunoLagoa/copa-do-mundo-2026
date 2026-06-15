/**
 * fetch-missing-avatars.mjs
 *
 * Passe focado nos jogadores que sobraram sem foto. Lê a lista de IDs/nomes
 * (gerada a partir dos rosters da ESPN), busca de forma sequencial e gentil
 * (sem rajadas → sem 429) em fontes mais robustas e mescla em
 * src/data/playerPhotosEspn.ts.
 *
 * Fontes: Wikidata (P18, preferindo entidade de futebol) → Wikipedia
 * multi-idioma (en/es/tr/ar/fa/ko/pt) via sitelinks da entidade → TheSportsDB.
 *
 * Uso: node scripts/fetch-missing-avatars.mjs '<json com [{aid,name}]>'
 *  ou:  node scripts/fetch-missing-avatars.mjs   (lê /tmp/missing.json)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = join(__dirname, '..', 'src', 'data', 'playerPhotosEspn.ts');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const removeAccents = (s) => s.normalize('NFD').replace(/\p{Mn}/gu, '');
const WIKI_LANGS = ['en', 'es', 'tr', 'pt', 'ar', 'fa', 'ko', 'de', 'fr'];

async function fetchJson(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'copa-2026-build/1.0 (github.com/pocs/copa-2026)' },
        signal: AbortSignal.timeout(9000),
      });
      if (res.status === 429) { await sleep(4000); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch { await sleep(600); }
  }
  return null;
}

function commonsUrl(file) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(String(file).replace(/ /g, '_'))}`;
}

/** Busca a entidade Wikidata mais provável (preferindo descrição de futebol). */
async function wikidataEntity(name) {
  const variants = [name, removeAccents(name), name.replace(/[.'-]/g, ' ').replace(/\s+/g, ' ').trim()]
    .filter((v, i, a) => v && a.indexOf(v) === i);
  for (const variant of variants) {
    const search = await fetchJson(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=7&search=${encodeURIComponent(variant)}`,
    );
    const hits = search?.search ?? [];
    if (!hits.length) continue;
    const isFoot = (d = '') => /foot|soccer/i.test(d);
    const ordered = [...hits].sort((a, b) => Number(isFoot(b.description)) - Number(isFoot(a.description)));
    const ids = ordered.map((h) => h.id);
    const ent = await fetchJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${encodeURIComponent(ids.join('|'))}&props=claims|sitelinks`,
    );
    const entities = ent?.entities ?? {};
    // 1ª passada: entidade de futebol com P18
    for (const h of ordered) {
      const e = entities[h.id];
      const img = e?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (img && isFoot(h.description)) return { img, entity: e };
    }
    // 2ª passada: qualquer entidade com P18
    for (const h of ordered) {
      const e = entities[h.id];
      const img = e?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (img) return { img, entity: e };
    }
    // sem P18, mas com sitelinks → tenta Wikipedia (futebol primeiro)
    for (const h of ordered) {
      const e = entities[h.id];
      const keys = Object.keys(e?.sitelinks ?? {}).filter((k) => /wiki$/.test(k) && k !== 'commonswiki');
      if (keys.length && isFoot(h.description)) return { img: null, entity: e };
    }
    for (const h of ordered) {
      const e = entities[h.id];
      const keys = Object.keys(e?.sitelinks ?? {}).filter((k) => /wiki$/.test(k) && k !== 'commonswiki');
      if (keys.length) return { img: null, entity: e };
    }
  }
  return null;
}

/** Thumbnail via Wikipedia: usa TODOS os sitelinks (qualquer idioma) + nome ASCII. */
async function wikipediaThumb(name, entity) {
  const titles = [];
  const sitelinks = entity?.sitelinks ?? {};
  const langOf = (key) => key.replace(/wiki$/, '');
  const wikiKeys = Object.keys(sitelinks).filter((k) => /^[a-z]+wiki$/.test(k) && k !== 'commonswiki');
  // idiomas preferidos primeiro; depois qualquer outro disponível
  const prefer = WIKI_LANGS.map((l) => `${l}wiki`).filter((k) => wikiKeys.includes(k));
  const rest = wikiKeys.filter((k) => !prefer.includes(k));
  for (const key of [...prefer, ...rest]) {
    const t = sitelinks[key]?.title;
    if (t) titles.push([langOf(key), t]);
  }
  titles.push(['en', name], ['en', removeAccents(name)]);

  for (const [lang, title] of titles) {
    const slug = encodeURIComponent(title.replace(/\s+/g, '_'));
    const sum = await fetchJson(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`);
    if (sum?.thumbnail?.source) return sum.thumbnail.source;
    // pageimages: imagem original/representativa (cobre páginas sem thumbnail no summary)
    const q = await fetchJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original|thumbnail&pithumbsize=800&titles=${slug}`,
    );
    const page = q?.query?.pages && Object.values(q.query.pages)[0];
    const url = page?.original?.source || page?.thumbnail?.source;
    if (url) return url;
    await sleep(120);
  }
  return null;
}

async function theSportsDB(name) {
  const variants = [name, removeAccents(name)].filter((v, i, a) => a.indexOf(v) === i);
  for (const variant of variants) {
    await sleep(1200);
    const data = await fetchJson(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(variant)}`);
    const players = data?.player;
    if (Array.isArray(players) && players.length) {
      const url = players.map((p) => p?.strCutout || p?.strThumb || p?.strRender).find(Boolean);
      if (url) return url;
    }
  }
  return null;
}

async function resolve(name) {
  const wd = await wikidataEntity(name);
  if (wd?.img) return { url: commonsUrl(wd.img), src: 'wikidata' };
  const wp = await wikipediaThumb(name, wd?.entity);
  if (wp) return { url: wp, src: 'wikipedia' };
  const tsdb = await theSportsDB(name);
  if (tsdb) return { url: tsdb, src: 'tsdb' };
  return null;
}

function loadExisting() {
  const content = readFileSync(OUTPUT_FILE, 'utf8');
  const out = {};
  const re = /"(\d+)":\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(content))) out[m[1]] = m[2];
  return out;
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

async function main() {
  const arg = process.argv[2];
  const list = arg ? JSON.parse(arg) : JSON.parse(readFileSync('/tmp/missing.json', 'utf8'));
  console.log(`🎯 ${list.length} jogadores a recuperar.\n`);

  const photoMap = loadExisting();
  const found = [], still = [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const r = await resolve(p.name);
    if (r) { photoMap[p.aid] = r.url; found.push(p.name); }
    else still.push(`${p.code || '?'} · ${p.name}`);
    console.log(`  [${i + 1}/${list.length}] ${p.name} → ${r ? r.src + ' ✓' : '—'}`);
    writeFileSync(OUTPUT_FILE, generate(photoMap), 'utf8');
    await sleep(250);
  }

  console.log(`\n✅ recuperados: ${found.length}/${list.length}`);
  if (still.length) {
    console.log(`\n❌ ainda sem foto (${still.length}):`);
    for (const s of still) console.log('   -', s);
  }
}

main().catch((e) => { console.error('Erro fatal:', e); process.exit(1); });
