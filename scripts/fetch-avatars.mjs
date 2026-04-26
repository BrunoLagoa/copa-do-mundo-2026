/**
 * fetch-avatars.mjs
 * Script de build único: busca fotos reais dos jogadores via Wikipedia (primário) + TheSportsDB (fallback).
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
const TSDB_DELAY_MS = 1500;    // TheSportsDB precisa de mais espaço
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

// ─── Fontes de foto ─────────────────────────────────────────────────────────

async function fetchFromWikipedia(name) {
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
      const thumb = players[0]?.strThumb;
      if (thumb && thumb.length > 0) return thumb;
    }
  }
  return null;
}

async function resolvePhoto(name, index, total) {
  // Estratégia: Wikipedia primeiro (sem rate limit), TheSportsDB como fallback
  await sleep(DELAY_MS);

  // Passo 1: Wikipedia
  const wikiPhoto = await fetchFromWikipedia(name);
  if (wikiPhoto) {
    console.log(`  [${index}/${total}] ${name} → wikipedia ✓`);
    return wikiPhoto;
  }

  // Passo 2: TheSportsDB (mais lento devido ao rate limit)
  const tsdbPhoto = await fetchFromTheSportsDB(name);
  if (tsdbPhoto) {
    console.log(`  [${index}/${total}] ${name} → tsdb ✓`);
    return tsdbPhoto;
  }

  console.log(`  [${index}/${total}] ${name} → dicebear (não encontrado)`);
  return null;
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

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Extraindo nomes dos jogadores...');
  const names = getAllPlayerNames();
  console.log(`📋 ${names.length} jogadores únicos encontrados.\n`);

  const photoMap = {};
  let found = 0;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const photo = await resolvePhoto(name, i + 1, names.length);
    if (photo) {
      photoMap[name] = photo;
      found++;
    }

    // Salva progresso a cada 50 jogadores
    if ((i + 1) % 50 === 0) {
      writeFileSync(OUTPUT_FILE, generateOutputFile(photoMap), 'utf-8');
      console.log(`  💾 Progresso salvo: ${found}/${i + 1} encontrados`);
    }
  }

  console.log(`\n✅ Cobertura: ${found}/${names.length} jogadores (${Math.round((found / names.length) * 100)}%)`);

  const output = generateOutputFile(photoMap);
  writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`💾 Salvo em: src/data/playerPhotos.ts`);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
