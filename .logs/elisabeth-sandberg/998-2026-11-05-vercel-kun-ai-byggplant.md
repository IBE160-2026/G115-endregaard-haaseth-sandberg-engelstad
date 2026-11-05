# Vercel: kun AI_BYGGplant

## 2026-11-05 — Elisabeth Sandberg

### Oppgave
Endre Vercel-prosjektet slik at bare AI_BYGGplant er med. ByggAPP skal ikke lenger publiseres der.

### Plan
- Fjerne `byggapp`-tjenesten og regelen som sendte `/` til ByggAPP fra `vercel.json`.
- Beholde AI_BYGGplant og API-et på `/ai-byggplant/`, så lenkene fra [vercel-deploy](999-2026-11-03-20-12-00-vercel-deploy.md) fortsatt virker, og sende `/` videre dit.

### Resultat
- `606ea2f`: `vercel.json` har nå bare `ai_byggplant` og `ai_byggplant_api`, og en midlertidig videresending (307) fra `/` til `/ai-byggplant/`.
- Sjekket etter deploy: `/` sender videre til `/ai-byggplant/`, som gir 200 (side og JavaScript). `GET /api/config` og `POST /api/turn` svarer (demomodus). Ukjente ruter gir 404.
- ByggAPP-koden ligger fortsatt i repoet, uendret. Den bygges bare ikke på Vercel lenger, så ByggAPP-lenken i forrige logg virker ikke.

### Lenker
- AI_BYGGplant: https://g115-endregaard-haaseth-sandberg-en.vercel.app/ai-byggplant/

### Åpne punkter
- Eventuelt flytte AI_BYGGplant til rotadressen (`/`) i stedet for å sende videre, hvis gruppen vil ha en kortere lenke.
