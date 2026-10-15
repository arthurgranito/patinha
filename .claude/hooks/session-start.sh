#!/bin/bash
# SessionStart do Patinha: prepara a sessão na nuvem (dependências + Supabase local).
# Só roda quando CLAUDE_CODE_REMOTE=true; no seu computador não faz nada.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"
LOG_DIR="${TMPDIR:-/tmp}/patinha-session-start"
mkdir -p "$LOG_DIR"
inicio=$(date +%s)

# 1. Dependências (npm, definido na Fase 0). Pula se node_modules já bate com o lockfile.
if [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "[session-start] npm ci…"
  npm ci --no-audit --no-fund --loglevel=error > "$LOG_DIR/npm.log" 2>&1 || {
    echo "[session-start] npm ci falhou; veja $LOG_DIR/npm.log" >&2
    tail -20 "$LOG_DIR/npm.log" >&2
    exit 1
  }
else
  echo "[session-start] node_modules em dia, npm ci pulado."
fi

# 2. Docker: na nuvem o daemon pode não estar rodando.
if ! docker info > /dev/null 2>&1; then
  if command -v dockerd > /dev/null 2>&1; then
    echo "[session-start] iniciando dockerd…"
    nohup dockerd > "$LOG_DIR/dockerd.log" 2>&1 &
    for _ in $(seq 1 30); do
      docker info > /dev/null 2>&1 && break
      sleep 1
    done
  fi
fi

# 3. Supabase local. Falha aqui não bloqueia a sessão (lint/typecheck/jest seguem funcionando).
# Depois de reiniciar o dockerd, contêineres antigos do Supabase voltam sozinhos e levam alguns
# segundos para ficar saudáveis; por isso há até 3 tentativas.
if docker info > /dev/null 2>&1; then
  supabase_ok=false
  for tentativa in 1 2 3; do
    if npx supabase status > /dev/null 2>&1; then
      supabase_ok=true
      break
    fi
    echo "[session-start] supabase start (tentativa $tentativa)…"
    if npx supabase start > "$LOG_DIR/supabase.log" 2>&1; then
      supabase_ok=true
      break
    fi
    sleep 15
  done
  if [ "$supabase_ok" = true ]; then
    echo "[session-start] Supabase local no ar: API http://127.0.0.1:54321 · Studio http://localhost:54323"
  else
    echo "[session-start] AVISO: supabase start falhou; veja $LOG_DIR/supabase.log" >&2
    tail -20 "$LOG_DIR/supabase.log" >&2
  fi
else
  echo "[session-start] AVISO: Docker indisponível; Supabase local não foi iniciado." >&2
fi

echo "[session-start] pronto em $(( $(date +%s) - inicio ))s."
