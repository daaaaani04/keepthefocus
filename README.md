# Keep the Focus

App di studio con gli amici: ognuno ha il proprio timer, guadagna punti studiando senza interruzioni e compete nella classifica del proprio cerchio.

Scritta con [Expo](https://expo.dev) (React Native), quindi gira come web app e più avanti si può pubblicare sull'App Store. Database, login e aggiornamenti in tempo reale sono su [Supabase](https://supabase.com).

## Regola dei punti

| Minuti consecutivi | Punti al minuto |
|---|---|
| 0 – 25 | 1 |
| 25 – 50 | 1,5 |
| oltre 50 | 2 |

Fermare il timer chiude la sessione: la successiva riparte da 1 punto al minuto. I punti sono calcolati dal server e una sessione dimenticata accesa conta al massimo 4 ore.

## Configurazione

1. Nello **SQL Editor** di Supabase esegui `supabase/migrations/0001_init.sql`.
2. Copia `.env.example` in `.env` e inserisci la chiave *publishable/anon* (Supabase → Project Settings → API). Non usare mai la chiave *secret/service_role*.
3. `npm install`
4. `npm run web` per aprire l'app nel browser.

## Comandi

- `npm run web`: avvia l'app nel browser
- `npm run typecheck`: controllo dei tipi
- `npm run build:web`: crea la versione web statica in `dist/`

## Struttura

- `src/app/`: schermate (Expo Router)
- `src/lib/`: client Supabase e regola dei punti
- `supabase/migrations/`: schema del database, permessi e funzioni
