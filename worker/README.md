# Proxy de placares ao vivo (Cloudflare Worker)

Intermediário entre o app estático e a API de futebol. Resolve **CORS**, esconde
a **chave** e faz **cache de 60s** (respeita o limite de 10 req/min do free tier).

Provider atual: **football-data.org**, competição `WC`. Para trocar por um plano
pago com live minuto-a-minuto, edite `fetchUpstream()` / `normalize()` em
`live-scores.js` — o formato devolvido ao app não muda.

## Passo a passo

1. **Conta + chave** (grátis): cadastre-se em https://www.football-data.org/client/register
   e copie seu token (X-Auth-Token).

2. **Login na Cloudflare** (grátis):
   ```bash
   cd worker
   npx wrangler login
   ```

3. **Guarde a chave como secret** (não vai pro git):
   ```bash
   npx wrangler secret put FOOTBALL_DATA_TOKEN
   # cole o token quando pedir
   ```

4. **(Opcional) trave o CORS** na sua origem: edite `ALLOWED_ORIGIN` em
   `wrangler.toml` para a URL do app (ex.: `https://seu-usuario.github.io`).

5. **Deploy**:
   ```bash
   npx wrangler deploy
   ```
   No fim ele imprime a URL pública, algo como
   `https://copa2026-live-scores.SEU-SUBDOMINIO.workers.dev`.

6. **Aponte o app pra ela**: crie um arquivo `.env.local` na raiz do projeto:
   ```
   VITE_LIVE_SCORES_URL=https://copa2026-live-scores.SEU-SUBDOMINIO.workers.dev
   ```
   Rode `npm run dev`. Sem essa variável, o app funciona normalmente (placar
   manual) — o "ao vivo" só liga quando a URL existe.

## Testar rápido

```bash
curl https://copa2026-live-scores.SEU-SUBDOMINIO.workers.dev | jq '.matches[0]'
```

Deve retornar um objeto com `utcDate`, `status`, `homeCode`, `awayCode`, `home`, `away`.

## Nota sobre "tempo real"

No free tier da football-data.org os placares chegam **com atraso de alguns
minutos** (não minuto-a-minuto). O resultado final aparece sozinho pouco depois
do fim do jogo. Para live instantâneo, troque para um plano de livescores pago —
só este Worker muda, o app continua igual.
