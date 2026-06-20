/**
 * Notícias — últimas manchetes da Copa, direto da ESPN.
 *
 * Manchete em destaque + grid de cards. Cada card abre a matéria completa na
 * ESPN (nova aba). Conteúdo em inglês (fonte ESPN); moldura em PT-BR.
 */

import { Newspaper, ExternalLink, Radio } from 'lucide-react';
import { useFootballNews, type NewsArticle } from '../hooks/useFootballNews';

function timeAgo(date: Date | null): string {
  if (!date) return '';
  const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `há ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.round(h / 24)}d`;
}

// ─── Manchete em destaque ─────────────────────────────────────────────────────

function FeaturedCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sm:col-span-2 lg:col-span-3"
    >
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.imageCaption ?? article.headline}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
            <Newspaper size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Destaque
          </span>
          <h2 className="mt-2 text-lg sm:text-2xl font-bold leading-tight text-white">
            {article.headline}
          </h2>
          {article.description && (
            <p className="mt-1.5 line-clamp-2 max-w-3xl text-sm text-gray-200">
              {article.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-300">
            {article.byline && <span className="truncate">{article.byline}</span>}
            {article.byline && article.published && <span>·</span>}
            <span>{timeAgo(article.published)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── Card padrão ──────────────────────────────────────────────────────────────

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.imageCaption ?? article.headline}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-600">
            <Newspaper size={32} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-3 text-sm font-bold leading-snug text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400">
          {article.headline}
        </h3>
        {article.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
            {article.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-2.5 text-[11px] text-gray-400 dark:text-gray-500">
          <span>{timeAgo(article.published)}</span>
          <ExternalLink size={11} className="ml-auto shrink-0" />
        </div>
      </div>
    </a>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="aspect-video w-full animate-pulse bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-2.5 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function NewsView() {
  const { articles, lastUpdated, loading, error } = useFootballNews();
  const [featured, ...rest] = articles;

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          <Newspaper size={20} className="text-green-600" />
          Notícias
        </h1>
        {lastUpdated && (
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Radio size={11} className="text-green-500" />
            atualizado {timeAgo(lastUpdated)}
          </span>
        )}
      </div>

      {error && articles.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
          <Newspaper size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Não foi possível carregar as notícias
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            A fonte (ESPN) pode estar indisponível. Tente novamente em instantes.
          </p>
        </div>
      ) : loading && articles.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured && <FeaturedCard article={featured} />}
          {rest.map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
