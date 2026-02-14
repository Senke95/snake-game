# Best Practice 2026

## Kodkvalitet

- Skriv små, tydliga funktioner med ett ansvar.
- Använd centraliserade konstanter istället för magiska tal.
- Håll state-flöden explicita med state machine där det passar.
- Dokumentera gränssnitt mellan lager (frontend, API, databas).

## Säkerhet

- Validera all indata server-side även om klienten validerar.
- Lagra inga hemligheter i repo.
- Begränsa CORS till behov när produktion är stabil.
- Lägg till rate-limit och enkel abuse-skydd för öppna endpoints.

## Prestanda

- Mät först, optimera sen.
- Rendera statiska lager till offscreen canvas.
- Separerad logik-tick och render-loop för konsekvent spelkänsla.
- Begränsa dyra effekter och gör dem avstängningsbara.

## Tillgänglighet

- Ge statusuppdateringar via `aria-live`.
- Säkerställ tangentbordsstyrning för kritiska flöden.
- Använd tydlig kontrast och konsekvent fokusmarkering.

## Drift och observability

- Dokumentera deployflöde steg för steg.
- Ha tydliga felmeddelanden som hjälper användaren vidare.
- Ha enkel felsökningsrutin för API och UI.

## Dokumentation

- README ska fungera som startpunkt.
- Arkitektur, API och kodreferens ska versioneras i repot.
- Uppdatera dokumentation i samma commit som beteendeförändringar.
