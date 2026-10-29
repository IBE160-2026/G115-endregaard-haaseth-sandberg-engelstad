# Dilemmas – G115 AI_BYGGplant

The choices the AI (Claude Code) put to the group, with the group's reply word for word, one section per version (newest first). Each entry has at most four lines: the prompt, the reply, and what came of it.

## v0.1 – 2026-10-29

**Open:** The draft has not yet been run against Claude (no API key on the development PC); try a full dialog for a garage and a house and tune `server/prompt.ts`. Choices the AI made without asking: the model is claude-opus-5-5 at medium effort; the API key lives on the Vite dev server, so the app runs locally but not as a static page (a published version needs a small backend or a Claude Artifact); the AI returns the whole project every turn; the building tab is 2D (elevations and a plan), not 3D.

1. **A new app.** Prompt: none (the group's own request).
   Reply: "Opprett ny mappe som heter AI_BYGGplant. Jeg ønsker å bygge en app som skal visualisere og strukturere en byggeprosess. Inputen skal være AI generert uten regler. output skal visualiseres som ByggAPP. BMAD rammeverket og Skills og annent fra 01. Admin skal brukes. Jeg ønsker at den skal starte med Hei, hva skal bygges? Deretter så skriver brukeren input, deretter genererer AI spørsmål om byggeprosjektet. Utifra det så stilles nye spørsmål som naturlig tar prosessen videre. Først de grove tingene som terreng. byggets størrelse, antall etasjer, dører og vinduer. Er det f.eks en garasje så er det naturlig å spørre om port. Deretter skal budsjett og GANT diagram genereres. Start smalt, også spør bredere etterhvert. Det skal være en dialog som alltid er åpen for endringer. Vinduet/appen må ha tabs hvor brukeren kan se informasjonen. Start med et utkast. Push Git og bruk samme regler som ByggAPP for G115 filene."
   Result: v0.1 in `AI_BYGGplant/`, with a BMAD spec in `.docs/implementation-artifacts/` and these G115 files.
