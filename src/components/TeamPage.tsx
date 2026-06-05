import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { TEAMS_BY_SLUG } from '../data/teams';
import type { Fixture, Formation, Player } from '../types';
import { ALL_FORMATIONS } from '../types';
import {
  getNextTeamMatch,
  getTeamMatches,
  isDateFuture,
  isDatePast,
} from '../utils/matchDate';
import FootballPitch from './FootballPitch';
import PlayerModal from './PlayerModal';

function formatDate(iso: string): string {
  const [, mm, dd] = iso.split('-');
  return `${parseInt(dd, 10)}/${parseInt(mm, 10)}`;
}

function formatWeekday(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 3));
  return date.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' });
}

function NextMatchCallout({ fixture, teamFlag }: { fixture: Fixture; teamFlag: string }) {
  const isHome = fixture.homeSlug !== 'tbd';
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const opponentFlag = isHome ? fixture.awayFlag : fixture.homeFlag;
  return (
    <Link
      to="/jogos"
      className="block mb-4 p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl text-white shadow-md transition-colors"
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-90 mb-1.5">
        <Calendar size={12} />
        Próximo jogo
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl leading-none">{teamFlag}</span>
          <span className="text-sm font-medium opacity-90">vs</span>
          <span className="text-2xl leading-none">{opponentFlag}</span>
          <span className="text-base font-bold truncate">{opponent}</span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold tabular-nums">{fixture.time}</div>
          <div className="text-[10px] uppercase opacity-80">BRT</div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs opacity-90">
        <span className="capitalize">{formatWeekday(fixture.date)}</span>
        <span>·</span>
        <span>{formatDate(fixture.date)}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {fixture.city}
        </span>
      </div>
    </Link>
  );
}

export function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const team = slug ? TEAMS_BY_SLUG[slug] : undefined;
  const matches = slug ? getTeamMatches(slug) : [];
  const nextMatch = slug ? getNextTeamMatch(slug) : null;
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation>(
    team?.formation ?? '4-3-3'
  );

  if (!team) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-lg">Seleção não encontrada.</p>
        <Link to="/" className="mt-4 inline-block text-green-600 hover:underline text-sm font-medium">
          ← Voltar para os grupos
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
      {/* disclaimer */}
      <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300">
        Dados projetados — elencos e jogos são estimativas sujeitas a alteração.
      </div>

      {/* back */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline mb-4">
        ← Voltar para os grupos
      </Link>

      {/* header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-5xl leading-none">{team.team.flag}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{team.team.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Grupo {team.groupId} · {team.confederation} · Técnico: {team.coach}
          </p>
        </div>
        {team.team.isHost && (
          <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">
            País Anfitrião
          </span>
        )}
      </div>

      {/* next match callout */}
      {nextMatch && (
        <NextMatchCallout fixture={nextMatch} teamFlag={team.team.flag} />
      )}

      {/* formation pitch */}
      <div className="mb-20 bg-gray-50 dark:bg-[#121728] rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <label
            htmlFor="formation-select"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Formação:
          </label>
          <select
            id="formation-select"
            value={selectedFormation}
            onChange={(e) => setSelectedFormation(e.target.value as Formation)}
            className="text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {ALL_FORMATIONS.map((f) => (
              <option key={f} value={f}>
                {f}{f === team.formation ? ' ✦' : ''}
              </option>
            ))}
          </select>
        </div>
        <FootballPitch
          players={team.players}
          formation={selectedFormation}
          teamName={team.team.name}
          teamSlug={team.slug}
          onPlayerClick={(p) => setSelectedPlayer(p)}
        />
      </div>

      {/* player modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          teamSlug={team.slug}
          teamFlag={team.team.flag}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {/* squad */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Elenco</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left w-10">#</th>
                <th className="px-3 py-2 text-left">Jogador</th>
                <th className="px-3 py-2 text-left hidden sm:table-cell">Posição</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Clube</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {team.players.map((p) => (
                <tr
                  key={p.number}
                  onClick={() => setSelectedPlayer(p)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2 text-gray-400 dark:text-gray-500 font-mono">{p.number}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{p.name}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{p.position}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden md:table-cell">{p.club}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* games */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Jogos</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Fase</th>
                <th className="px-3 py-2 text-left">Adversário</th>
                <th className="px-3 py-2 text-left">Horário</th>
                <th className="px-3 py-2 text-left hidden sm:table-cell">Data</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Local</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {matches.map((g) => {
                const isHome = g.homeSlug === slug;
                const opponent = isHome ? g.awayTeam : g.homeTeam;
                const opponentFlag = isHome ? g.awayFlag : g.homeFlag;
                const phaseLabel =
                  g.phase === 'group'
                    ? `Grupo ${g.group} · R${g.matchday}`
                    : g.phase === 'round-of-32'
                      ? '32-avos'
                      : g.phase === 'round-of-16'
                        ? 'Oitavas'
                        : g.phase === 'quarter'
                          ? 'Quartas'
                          : g.phase === 'semi'
                            ? 'Semifinal'
                            : g.phase === 'third'
                              ? '3º lugar'
                              : 'Final';
                const future = isDateFuture(g.date ? new Date(`${g.date}T${g.time}:00-03:00`) : new Date(0));
                const past = isDatePast(g.date ? new Date(`${g.date}T${g.time}:00-03:00`) : new Date(0));
                return (
                  <tr
                    key={g.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${past ? 'opacity-60' : ''}`}
                  >
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{phaseLabel}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                      <span className="mr-1">{opponentFlag}</span>
                      {opponent}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold tabular-nums ${
                          future
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {g.time}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {formatDate(g.date)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {g.city}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
