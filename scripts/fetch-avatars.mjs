/**
 * fetch-avatars.mjs
 * Script de build único: busca fotos reais dos jogadores com múltiplas fontes.
 * Estratégia: Wikidata/Commons -> Wikipedia -> TheSportsDB -> Google Imagens -> DiceBear masculino.
 * Gera src/data/playerPhotos.ts com Record<string, string>.
 * Executar: node scripts/fetch-avatars.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TEAMS_DIR = join(ROOT, 'src', 'data', 'teams');
const OUTPUT_FILE = join(ROOT, 'src', 'data', 'playerPhotos.ts');

const DELAY_MS = 200;          // Wikipedia é mais permissiva
const TSDB_DELAY_MS = 1200;
const GOOGLE_DELAY_MS = 400;
const MAX_RETRIES = 2;

// ─── Utilitários ────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function removeAccents(str) {
  return str.normalize('NFD').replace(/\p{Mn}/gu, '');
}

function toWikiSlug(name) {
  // Remove trailing dots, convert spaces to underscores
  return name.replace(/\.\s*$/, '').replace(/\s+/g, '_');
}

async function fetchJson(url) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'copa-2026-build-script/1.0 (github.com/pocs/copa-2026)' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 429) {
        await sleep(5000);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (i === MAX_RETRIES - 1) return null;
      await sleep(500);
    }
  }
  return null;
}

async function fetchText(url) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'copa-2026-build-script/1.0 (github.com/pocs/copa-2026)' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 429) {
        await sleep(5000);
        continue;
      }
      if (!res.ok) return null;
      return await res.text();
    } catch {
      if (i === MAX_RETRIES - 1) return null;
      await sleep(500);
    }
  }
  return null;
}

async function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!/^https?:\/\//.test(url)) return false;
  if (url.startsWith('data:')) return false;

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'copa-2026-build-script/1.0 (github.com/pocs/copa-2026)' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return false;
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('image')) return false;
    return true;
  } catch {
    return false;
  }
}

async function pickFirstValidImageUrl(urls) {
  for (const url of urls) {
    if (await isValidImageUrl(url)) return url;
  }
  return null;
}

// ─── Fontes de foto ─────────────────────────────────────────────────────────

async function fetchFromWikidataCommons(name) {
  const variants = [name, removeAccents(name), name.replace(/\./g, '').trim()]
    .filter((v, i, arr) => v && arr.indexOf(v) === i);

  for (const variant of variants) {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=5&search=${encodeURIComponent(variant)}`;
    const searchData = await fetchJson(searchUrl);
    const ids = (searchData?.search ?? []).map((item) => item.id).filter(Boolean);
    if (!ids.length) continue;

    const entitiesUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${encodeURIComponent(ids.join('|'))}&props=claims`;
    const entitiesData = await fetchJson(entitiesUrl);
    const entities = entitiesData?.entities ?? {};

    for (const id of ids) {
      const claim = entities[id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (!claim) continue;
      const imageName = String(claim).replace(/ /g, '_');
      const commonsUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}`;
      if (await isValidImageUrl(commonsUrl)) return commonsUrl;
    }
  }

  return null;
}

async function fetchFromWikipediaSummary(name) {
  // Try exact name first, then without accents
  const variants = [
    toWikiSlug(name),
    toWikiSlug(removeAccents(name)),
  ].filter((v, i, arr) => arr.indexOf(v) === i); // deduplicate

  for (const slug of variants) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
    const data = await fetchJson(url);
    if (data?.thumbnail?.source) return data.thumbnail.source;
    await sleep(100);
  }
  return null;
}

async function fetchFromWikipediaQuery(name) {
  const variants = [
    toWikiSlug(name),
    toWikiSlug(removeAccents(name)),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  for (const title of variants) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&titles=${encodeURIComponent(title)}`;
    const data = await fetchJson(url);
    const pages = data?.query?.pages;
    if (!pages) continue;
    const page = Object.values(pages)[0];
    const candidates = [page?.original?.source, page?.thumbnail?.source].filter(Boolean);
    const valid = await pickFirstValidImageUrl(candidates);
    if (valid) return valid;
  }

  return null;
}

async function fetchFromTheSportsDB(name) {
  // Try exact name, then without accents, then without dots
  const variants = [
    name,
    removeAccents(name),
    name.replace(/\./g, '').trim(),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  for (const variant of variants) {
    await sleep(TSDB_DELAY_MS);
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(variant)}`;
    const data = await fetchJson(url);
    const players = data?.player;
    if (Array.isArray(players) && players.length > 0) {
      const candidates = players
        .flatMap((player) => [player?.strCutout, player?.strThumb, player?.strRender])
        .filter(Boolean);
      const valid = await pickFirstValidImageUrl(candidates);
      if (valid) return valid;
    }
  }

  return null;
}

async function fetchFromGoogleImages(name) {
  // Variações para melhorar chance de achar foto real do atleta
  const variants = [
    `${name} jogador futebol seleção`,
    `${removeAccents(name)} football player portrait`,
    `${name.replace(/\./g, '').trim()} soccer player`,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  for (const variant of variants) {
    await sleep(GOOGLE_DELAY_MS);
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(variant)}`;
    const html = await fetchText(url);
    if (!html) continue;

    const matches = Array.from(html.matchAll(/"ou":"(https?:\/\/[^"]+)"/g));
    for (const match of matches) {
      const decodedUrl = match[1]
        .replace(/\\u003d/g, '=')
        .replace(/\\u0026/g, '&')
        .replace(/\\\//g, '/');

      if (await isValidImageUrl(decodedUrl)) return decodedUrl;
    }
  }

  return null;
}

function buildDicebearMaleAvatar(name) {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&gender=male`;
}

function isDicebearAvatar(url) {
  return typeof url === 'string' && url.includes('api.dicebear.com');
}

async function resolvePhoto(name, index, total) {
  // Estratégia: Wikidata/Commons → Wikipedia → TheSportsDB → Google Imagens → DiceBear
  await sleep(DELAY_MS);

  // Passo 1: Wikidata + Commons (P18)
  const wikidataPhoto = await fetchFromWikidataCommons(name);
  if (wikidataPhoto) {
    console.log(`  [${index}/${total}] ${name} → wikidata/commons ✓`);
    return wikidataPhoto;
  }

  // Passo 2: Wikipedia summary
  const wikiSummaryPhoto = await fetchFromWikipediaSummary(name);
  if (wikiSummaryPhoto) {
    console.log(`  [${index}/${total}] ${name} → wikipedia summary ✓`);
    return wikiSummaryPhoto;
  }

  // Passo 3: Wikipedia query API (pageimages)
  const wikiQueryPhoto = await fetchFromWikipediaQuery(name);
  if (wikiQueryPhoto) {
    console.log(`  [${index}/${total}] ${name} → wikipedia query ✓`);
    return wikiQueryPhoto;
  }

  // Passo 4: TheSportsDB
  const tsdbPhoto = await fetchFromTheSportsDB(name);
  if (tsdbPhoto) {
    console.log(`  [${index}/${total}] ${name} → tsdb ✓`);
    return tsdbPhoto;
  }

  // Passo 5: Google Imagens
  const googlePhoto = await fetchFromGoogleImages(name);
  if (googlePhoto) {
    console.log(`  [${index}/${total}] ${name} → google imagens ✓`);
    return googlePhoto;
  }

  // Passo 6: fallback final garantido
  const dicebearAvatar = buildDicebearMaleAvatar(name);
  console.log(`  [${index}/${total}] ${name} → dicebear masculino ✓`);
  return dicebearAvatar;
}

// ─── Extração de nomes ──────────────────────────────────────────────────────
function extractPlayerNames(fileContent) {
  const names = [];
  const playerBlocks = fileContent.match(/players:\s*\[([\s\S]*?)\]/g) ?? [];
  for (const block of playerBlocks) {
    const matches = block.matchAll(/name:\s*'([^']+)'/g);
    for (const m of matches) {
      names.push(m[1]);
    }
  }
  return names;
}

function getAllPlayerNames() {
  const files = readdirSync(TEAMS_DIR).filter((f) => f.startsWith('grupo-') && f.endsWith('.ts'));
  const allNames = new Set();
  for (const file of files) {
    const content = readFileSync(join(TEAMS_DIR, file), 'utf-8');
    const names = extractPlayerNames(content);
    for (const name of names) allNames.add(name);
  }
  return Array.from(allNames).sort();
}

// ─── Geração do arquivo de saída ─────────────────────────────────────────────

function generateOutputFile(photoMap) {
  const entries = Object.entries(photoMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, url]) => `  ${JSON.stringify(name)}: ${JSON.stringify(url)},`)
    .join('\n');

  return `// AUTO-GERADO por scripts/fetch-avatars.mjs — não editar manualmente
// Execute: node scripts/fetch-avatars.mjs
export const PLAYER_PHOTOS: Record<string, string> = {
${entries}
};
`;
}

// ─── Leitura do mapa já existente ────────────────────────────────────────────

function loadExistingPhotos() {
  try {
    const content = readFileSync(OUTPUT_FILE, 'utf-8');
    const existing = {};
    const re = /"([^"]+)":\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      existing[m[1]] = m[2];
    }
    return existing;
  } catch {
    return {};
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Extraindo nomes dos jogadores...');
  const allNames = getAllPlayerNames();
  console.log(`📋 ${allNames.length} jogadores únicos encontrados.`);

  const existingPhotos = loadExistingPhotos();
  const existingEntries = Object.entries(existingPhotos);
  const dicebearMapped = existingEntries.filter(([, url]) => isDicebearAvatar(url)).length;
  const realMapped = existingEntries.length - dicebearMapped;

  // Reprocessa quem está com DiceBear para tentar foto real em novas execuções
  const pending = allNames.filter((name) => {
    const currentPhoto = existingPhotos[name];
    return !currentPhoto || isDicebearAvatar(currentPhoto);
  });
  console.log(`✔️  ${realMapped} com foto real | ${dicebearMapped} com dicebear — buscando ${pending.length} jogadores.\n`);

  // Começa com o mapa existente para preservar entradas manuais e já buscadas
  const photoMap = { ...existingPhotos };
  let found = 0;

  for (let i = 0; i < pending.length; i++) {
    const name = pending[i];
    const photo = await resolvePhoto(name, i + 1, pending.length);
    if (photo) {
      photoMap[name] = photo;
      found++;
    }

    // Salva progresso a cada 50 jogadores
    if ((i + 1) % 50 === 0) {
      writeFileSync(OUTPUT_FILE, generateOutputFile(photoMap), 'utf-8');
      console.log(`  💾 Progresso salvo: ${found}/${i + 1} novos encontrados`);
    }
  }

  const totalMapped = Object.keys(photoMap).length;
  console.log(`\n✅ Novos: ${found}/${pending.length} | Total mapeado: ${totalMapped}/${allNames.length} (${Math.round((totalMapped / allNames.length) * 100)}%)`);

  const output = generateOutputFile(photoMap);
  writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`💾 Salvo em: src/data/playerPhotos.ts`);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
