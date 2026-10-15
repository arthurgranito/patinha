#!/usr/bin/env bash
# Confere o export de produção (npm run export:check): o login de teste não pode estar no bundle.
set -euo pipefail
dir="${1:-/tmp/expo-export}"
if grep -rlE 'Entrar como teste|patinha-teste|teste@patinha\.local' "$dir/_expo"; then
  echo "ERRO: o login de teste (DevLoginButton/devLogin) entrou no bundle de produção." >&2
  exit 1
fi
echo "Bundle de produção sem o login de teste."
