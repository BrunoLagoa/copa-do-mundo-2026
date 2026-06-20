/**
 * Últimas notícias da Copa — direto da ESPN.
 *
 * Fonte: `…/apis/site/v2/sports/soccer/fifa.world/news` (CORS aberto, sem chave).
 * 1 único fetch traz as manchetes mais recentes (headline, resumo, imagem,
 * autor, data e link da matéria). Poll de 5min com a aba visível — notícia não
 * muda a cada segundo como placar.
 *
 * O conteúdo da ESPN vem em inglês; a moldura da UI permanece em PT-BR.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { withEspnLang } from '../utils/espn';

const NEWS_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news';
const POLL_MS = 5 * 60_000;

/** Uma notícia normalizada. */
export interface NewsArticle {
  id: string;
  headline: string;
  description: string;
  published: Date | null;
  byline: string | null;
  type: string | null;
  imageUrl: string | null;
  imageCaption: string | null;
  link: string | null;     // URL da matéria completa na ESPN
}

export interface NewsState {
  articles: NewsArticle[];
  lastUpdated: Date | null;
  loading: boolean;
  error: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Primeira imagem com URL utilizável. */
function pickImage(images: any[]): { url: string | null; caption: string | null } {
  const img = Array.isArray(images) ? images.find((i) => i?.url) : null;
  return { url: img?.url ?? null, caption: img?.caption ?? null };
}

function mapArticle(a: any, i: number): NewsArticle {
  const { url, caption } = pickImage(a?.images ?? []);
  const published = a?.published ? new Date(a.published) : null;
  return {
    id: String(a?.id ?? a?.nowId ?? `${a?.published ?? ''}-${i}`),
    headline: a?.headline ?? '',
    description: a?.description ?? '',
    published: published && !Number.isNaN(published.getTime()) ? published : null,
    byline: a?.byline ?? null,
    type: a?.type ?? null,
    imageUrl: url,
    imageCaption: caption,
    link: a?.links?.web?.href ?? a?.links?.mobile?.href ?? null,
  };
}

function parseNews(json: any): NewsArticle[] {
  const list: any[] = Array.isArray(json?.articles) ? json.articles : [];
  return list
    .map(mapArticle)
    .filter((a) => a.headline)
    .sort(
      (x, y) => (y.published?.getTime() ?? 0) - (x.published?.getTime() ?? 0),
    );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useFootballNews(): NewsState {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchNews = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(withEspnLang(NEWS_URL), { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setArticles(parseNews(await res.json()));
      setLastUpdated(new Date());
      setError(false);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void fetchNews(), 0);
    const tick = () => {
      if (document.visibilityState === 'visible') void fetchNews();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      abortRef.current?.abort();
    };
  }, [fetchNews]);

  return useMemo(
    () => ({ articles, lastUpdated, loading, error }),
    [articles, lastUpdated, loading, error],
  );
}
