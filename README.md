# Patinha 🐾

Adestramento positivo gamificado para cães: treinos guiados de 10 minutos por dia, níveis, sequência, carteirinha de truques e cards para o story.

**Status:** Fase 0 (fundação) feita, veja `docs/progress.md`.

## Documentos
- `docs/resumo.md`: a ideia em 1 página.
- `docs/validacao.md`: o plano de 2 semanas antes do código.
- `docs/roadmap.md`: as fases, com prompts, critérios e custos.
- `docs/flows.md`: todos os fluxos do app.
- `docs/agentes-mcps-e-nuvem.md`: subagentes, MCPs e sessões na nuvem.
- `docs/passo-a-passo-nuvem.md`: do zero ao lançamento, no Claude Code na nuvem.
- `docs/progress.md`: o andamento (criado na Fase 0).

## Para quem desenvolve
Leia `AGENTS.md`.

```bash
npm ci
cp .env.example .env   # opcional na Fase 0
make dev               # QR code para o Expo Go
make db-up             # Supabase local (precisa do Docker)
make check             # tudo o que o CI roda
```
