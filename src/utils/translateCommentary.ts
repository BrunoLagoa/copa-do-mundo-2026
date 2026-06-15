/**
 * Traduz textos de narração de futebol do inglês para PT-BR.
 * Os textos vêm de uma API externa (ESPN/Sofascore) sempre em inglês.
 */

// Mapa de nomes de países em inglês → PT-BR (48 participantes da Copa 2026)
// Aplica word-boundary para não substituir substrings acidentais
const COUNTRY_MAP: [RegExp, string][] = [
  // América do Norte / CONCACAF
  [/\bUnited States\b/g, 'Estados Unidos'],
  [/\bUSA\b/g, 'EUA'],
  [/\bMexico\b/g, 'México'],
  [/\bCanada\b/g, 'Canadá'],
  [/\bCosta Rica\b/g, 'Costa Rica'],
  [/\bPanama\b/g, 'Panamá'],
  [/\bHonduras\b/g, 'Honduras'],
  [/\bJamaica\b/g, 'Jamaica'],
  // América do Sul / CONMEBOL
  [/\bBrazil\b/g, 'Brasil'],
  [/\bArgentina\b/g, 'Argentina'],
  [/\bUruguay\b/g, 'Uruguai'],
  [/\bColombia\b/g, 'Colômbia'],
  [/\bEcuador\b/g, 'Equador'],
  [/\bVenezuela\b/g, 'Venezuela'],
  [/\bChile\b/g, 'Chile'],
  [/\bParaguay\b/g, 'Paraguai'],
  [/\bPeru\b/g, 'Peru'],
  [/\bBolivia\b/g, 'Bolívia'],
  // Europa / UEFA
  [/\bNetherlands\b/g, 'Holanda'],
  [/\bGermany\b/g, 'Alemanha'],
  [/\bFrance\b/g, 'França'],
  [/\bSpain\b/g, 'Espanha'],
  [/\bEngland\b/g, 'Inglaterra'],
  [/\bPortugal\b/g, 'Portugal'],
  [/\bBelgium\b/g, 'Bélgica'],
  [/\bItaly\b/g, 'Itália'],
  [/\bSwitzerland\b/g, 'Suíça'],
  [/\bAustria\b/g, 'Áustria'],
  [/\bCroatia\b/g, 'Croácia'],
  [/\bDenmark\b/g, 'Dinamarca'],
  [/\bSweden\b/g, 'Suécia'],
  [/\bPoland\b/g, 'Polônia'],
  [/\bSerbia\b/g, 'Sérvia'],
  [/\bTurkey\b/g, 'Turquia'],
  [/\bRomania\b/g, 'Romênia'],
  [/\bHungary\b/g, 'Hungria'],
  [/\bCzech Republic\b/g, 'República Tcheca'],
  [/\bSlovakia\b/g, 'Eslováquia'],
  [/\bScotland\b/g, 'Escócia'],
  [/\bGreece\b/g, 'Grécia'],
  [/\bWales\b/g, 'País de Gales'],
  [/\bAlbania\b/g, 'Albânia'],
  [/\bSlovenia\b/g, 'Eslovênia'],
  [/\bUkraine\b/g, 'Ucrânia'],
  // África / CAF
  [/\bMorocco\b/g, 'Marrocos'],
  [/\bSenegal\b/g, 'Senegal'],
  [/\bEgypt\b/g, 'Egito'],
  [/\bNigeria\b/g, 'Nigéria'],
  [/\bCameroon\b/g, 'Camarões'],
  [/\bGhana\b/g, 'Gana'],
  [/\bTunisia\b/g, 'Tunísia'],
  [/\bAlgeria\b/g, 'Argélia'],
  [/\bCôte d'Ivoire\b/g, 'Costa do Marfim'],
  [/\bCote d'Ivoire\b/g, 'Costa do Marfim'],
  [/\bIvory Coast\b/g, 'Costa do Marfim'],
  [/\bSouth Africa\b/g, 'África do Sul'],
  [/\bMali\b/g, 'Mali'],
  [/\bBurkina Faso\b/g, 'Burkina Faso'],
  [/\bCongo DR\b/g, 'Congo'],
  [/\bCabo Verde\b/g, 'Cabo Verde'],
  // Ásia / AFC
  [/\bJapan\b/g, 'Japão'],
  [/\bSouth Korea\b/g, 'Coreia do Sul'],
  [/\bIran\b/g, 'Irã'],
  [/\bAustralia\b/g, 'Austrália'],
  [/\bSaudi Arabia\b/g, 'Arábia Saudita'],
  [/\bQatar\b/g, 'Catar'],
  [/\bUzbekistan\b/g, 'Uzbequistão'],
  [/\bJordan\b/g, 'Jordânia'],
  [/\bOman\b/g, 'Omã'],
  [/\bIraq\b/g, 'Iraque'],
  [/\bBahrain\b/g, 'Bahrein'],
  [/\bChina PR\b/g, 'China'],
  [/\bChina\b/g, 'China'],
  // Oceania / OFC
  [/\bNew Zealand\b/g, 'Nova Zelândia'],
];

// Padrões fixos (sem captura de nome de jogador)
const FIXED: [RegExp, string][] = [
  // Resultado / fim de partida
  [/^Match ends?,/i, 'Fim de jogo,'],
  [/^First Half ends?,/i, 'Fim do primeiro tempo,'],
  [/^Second Half ends?,/i, 'Fim do segundo tempo,'],
  [/^Extra Time First Half ends?,/i, 'Fim da prorrogação — 1º tempo,'],
  [/^Extra Time Second Half ends?,/i, 'Fim da prorrogação — 2º tempo,'],
  [/^Penalty Shootout ends?,/i, 'Fim das penalidades,'],
  [/^First Half begins/i, 'Início do primeiro tempo'],
  [/^Second Half begins/i, 'Início do segundo tempo'],
  [/^Extra Time First Half begins/i, 'Início da prorrogação — 1º tempo'],
  [/^Extra Time Second Half begins/i, 'Início da prorrogação — 2º tempo'],
  [/^Penalty Shootout begins/i, 'Início das penalidades'],

  // Escanteios
  [/^Corner,/i, 'Escanteio,'],
  [/Conceded by /i, 'concedido por '],

  // Gol
  [/^Goal!/i, 'Gol!'],
  [/\bscores\b/gi, 'marca'],

  // Chutes
  [/^Attempt saved\./i, 'Chute defendido.'],
  [/^Attempt missed\./i, 'Chute para fora.'],
  [/^Attempt blocked\./i, 'Chute bloqueado.'],
  [/\bright footed shot\b/gi, 'chute com o pé direito'],
  [/\bleft footed shot\b/gi, 'chute com o pé esquerdo'],
  [/\bheader\b/gi, 'cabeçada'],
  [/\bfrom outside the box\b/gi, 'de fora da área'],
  [/\bfrom inside the box\b/gi, 'de dentro da área'],
  [/\bfrom the centre of the box\b/gi, 'do centro da área'],
  [/\bfrom the right side of the box\b/gi, 'pelo lado direito da área'],
  [/\bfrom the left side of the box\b/gi, 'pelo lado esquerdo da área'],
  [/\bfrom the right side of the six yard box\b/gi, 'pela direita da pequena área'],
  [/\bfrom the left side of the six yard box\b/gi, 'pela esquerda da pequena área'],
  [/\bfrom very close range\b/gi, 'de muito perto'],
  [/\bfrom the penalty spot\b/gi, 'da marca do pênalti'],
  [/\bfrom a free kick\b/gi, 'em cobrança de falta'],
  // Defesas: específicas ANTES de `is saved` genérico
  [/\bis saved in the centre of the goal by\b/gi, 'é defendido no centro do gol por'],
  [/\bis saved in the bottom right corner by\b/gi, 'é defendido no canto inferior direito por'],
  [/\bis saved in the bottom left corner by\b/gi, 'é defendido no canto inferior esquerdo por'],
  [/\bis saved in the top right corner by\b/gi, 'é defendido no canto superior direito por'],
  [/\bis saved in the top left corner by\b/gi, 'é defendido no canto superior esquerdo por'],
  [/\bis saved by\b/gi, 'é defendido por'],
  [/\bis saved\b/gi, 'é defendido'],
  [/\bis blocked\b/gi, 'é bloqueado'],
  [/\bis just a bit too high\b/gi, 'passa um pouco por cima'],
  [/\bis too high and wide\b/gi, 'passa por cima e pelo lado'],
  [/\bis too high\b/gi, 'passa por cima'],
  [/\bis high and wide to the right\b/gi, 'passa por cima e à direita'],
  [/\bis high and wide to the left\b/gi, 'passa por cima e à esquerda'],
  [/\bis close, but misses to the right\b/gi, 'passa perto, mas vai à direita'],
  [/\bis close, but misses to the left\b/gi, 'passa perto, mas vai à esquerda'],
  [/\bmisses to the right\b/gi, 'vai à direita'],
  [/\bmisses to the left\b/gi, 'vai à esquerda'],
  [/\bin the bottom right corner\b/gi, 'no canto inferior direito'],
  [/\bin the bottom left corner\b/gi, 'no canto inferior esquerdo'],
  [/\bin the top right corner\b/gi, 'no canto superior direito'],
  [/\bin the top left corner\b/gi, 'no canto superior esquerdo'],
  [/\bin the centre of the goal\b/gi, 'no centro do gol'],

  // Faltas / cartões
  [/^Foul by /i, 'Falta de '],
  [/^(\w[\w\s]+) wins a free kick in the attacking half\./i, '$1 ganha falta no campo ofensivo.'],
  [/^(\w[\w\s]+) wins a free kick in the defensive half\./i, '$1 ganha falta no campo defensivo.'],
  [/\bwins a free kick\b/gi, 'ganha falta'],
  [/\bin the attacking half\b/gi, 'no campo ofensivo'],
  [/\bin the defensive half\b/gi, 'no campo defensivo'],
  [/\bon the right wing\b/gi, 'no lado direito do campo'],
  [/\bon the left wing\b/gi, 'no lado esquerdo do campo'],
  [/\bon the right flank\b/gi, 'no flanco direito'],
  [/\bon the left flank\b/gi, 'no flanco esquerdo'],
  [/\bis shown the yellow card for a bad foul\b/gi, 'recebe cartão amarelo por falta violenta'],
  [/\bis shown the yellow card for a foul\b/gi, 'recebe cartão amarelo por falta'],
  [/\bis shown the yellow card\b/gi, 'recebe cartão amarelo'],
  [/\bis shown the red card\b/gi, 'recebe cartão vermelho'],
  [/\bis shown a second yellow card\b/gi, 'recebe o segundo cartão amarelo'],
  [/^Yellow Card,/i, 'Cartão Amarelo,'],
  [/^Red Card,/i, 'Cartão Vermelho,'],
  [/^Second Yellow Card,/i, 'Segundo Cartão Amarelo,'],

  // Substituições
  [/^Substitution,/i, 'Substituição,'],
  [/\bSubstitution, (.+)\. (.+) replaces (.+)\./i, 'Substituição, $1. $3 dá lugar a $2.'],
  [/\breplaces\b/gi, 'substitui'],

  // Pênaltis
  [/^Penalty!/i, 'Pênalti!'],
  [/^Penalty missed!/i, 'Pênalti perdido!'],
  [/^Penalty saved!/i, 'Pênalti defendido!'],
  [/\bpenalty conceded by\b/gi, 'pênalti cometido por'],

  // Assistências
  [/\bAssisted by (.+) with a cross\./i, 'Assistência de $1 de cruzamento.'],
  [/\bAssisted by (.+) with a through ball\./i, 'Assistência de $1 com passe em profundidade.'],
  [/\bAssisted by (.+) with a headed pass\./i, 'Assistência de $1 de cabeça.'],
  [/\bAssisted by (.+) following a corner\./i, 'Assistência de $1 após escanteio.'],
  [/\bAssisted by (.+) following a set piece\./i, 'Assistência de $1 após bola parada.'],
  [/\bAssisted by\b/gi, 'Assistência de'],

  // Impedimento
  [/^Offside,/i, 'Impedimento,'],
  [/\bcaught offside\b/gi, 'pego em impedimento'],

  // Arremesso lateral
  [/^Throw-in /i, 'Arremesso lateral '],

  // Outros eventos
  [/^Kick off!/i, 'Começo de jogo!'],
  [/^Kick off\b/i, 'Começo de jogo'],
  [/^Delay in match /i, 'Atraso na partida '],
  [/^Delay over\./i, 'Atraso encerrado.'],
  [/\bThey are ready to continue\./gi, 'Jogo pronto para recomeçar.'],
  [/^Fourth official has announced (\d+) minutes? of added time\./i, 'O quarto árbitro indicou $1 minuto(s) de acréscimo.'],
  [/\bminutes? of added time\b/gi, 'minuto(s) de acréscimo'],
  [/^Dangerous play by /i, 'Jogo perigoso de '],
  [/^Handball by /i, 'Mão na bola de '],
  [/\bwith a cross\b/gi, 'de cruzamento'],
  [/\bwith a through ball\b/gi, 'com passe em profundidade'],
  [/\bto the top right corner\b/gi, 'no canto superior direito'],
  [/\bto the top left corner\b/gi, 'no canto superior esquerdo'],
  [/\bto the bottom right corner\b/gi, 'no canto inferior direito'],
  [/\bto the bottom left corner\b/gi, 'no canto inferior esquerdo'],
  [/\bfollowing a corner\b/gi, 'após escanteio'],
  [/\bfollowing a set piece\b/gi, 'após bola parada'],
];

/**
 * Traduz um texto de narração de futebol EN → PT-BR.
 * Aplica primeiro os termos técnicos e depois os nomes de países.
 */
export function translateCommentary(text: string): string {
  let t = text;
  for (const [pattern, replacement] of FIXED) {
    t = t.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of COUNTRY_MAP) {
    t = t.replace(pattern, replacement);
  }
  return t;
}

// Índice de país (string exata, sem regex) derivado do COUNTRY_MAP para
// traduções pontuais de nomes de países (perfil de jogador, etc.).
const COUNTRY_EXACT: Record<string, string> = (() => {
  const idx: Record<string, string> = {};
  for (const [pattern, value] of COUNTRY_MAP) {
    // extrai o termo entre \b...\b da fonte do regex
    const src = pattern.source.replace(/\\b/g, '').replace(/\\/g, '');
    if (src) idx[src.toLowerCase()] = value;
  }
  return idx;
})();

/**
 * Traduz um nome de país isolado EN → PT-BR (ex.: "Brazil" → "Brasil").
 * Retorna o original se não houver correspondência.
 */
export function translateCountry(name: string | null | undefined): string | null {
  if (!name) return null;
  return COUNTRY_EXACT[name.trim().toLowerCase()] ?? name;
}
