# Patinha — atalhos de desenvolvimento. Gerenciador de pacotes: npm.
.PHONY: install dev db-up db-down db-reset db-test types test lint typecheck format doctor export-check check

SUPABASE := npx supabase

install:
	npm ci

dev:
	npx expo start

db-up:
	$(SUPABASE) start

db-down:
	$(SUPABASE) stop

db-reset:
	$(SUPABASE) db reset

db-test:
	$(SUPABASE) test db

types:
	$(SUPABASE) gen types typescript --local --schema public > src/lib/database.types.ts

test:
	npm test -- --ci

lint:
	npm run lint
	npm run format:check

typecheck:
	npm run typecheck

doctor:
	npm run doctor

export-check:
	npm run export:check

check: lint typecheck test db-test doctor export-check
