#!/usr/bin/env bash
# Confere o export de produção (npm run export:check): o login de teste não pode estar no bundle.
set -euo pipefail
dir="${1:-/tmp/expo-export}"
if [ ! -d "$dir/_expo" ]; then
  echo "ERRO: $dir/_expo não existe; rode o export antes." >&2
  exit 1
fi
set +e
grep -rlE 'Entrar como teste|patinha-teste|teste@patinha\.local' "$dir/_expo"
rc=$?
set -e
case $rc in
  1) echo "Bundle de produção sem o login de teste." ;;
  0)
    echo "ERRO: o login de teste (DevLoginButton/devLogin) entrou no bundle de produção." >&2
    exit 1
    ;;
  *)
    echo "ERRO: falha ao inspecionar o bundle (grep saiu com $rc)." >&2
    exit 1
    ;;
esac
