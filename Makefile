# Shortcuts. Run from the repository root.
.PHONY: mock up down lint-api types test smoke

mock:       ## mock API for frontend work on :4010
	docker compose --profile mock up

up:         ## whole stack (needs backend and frontend images)
	docker compose --profile full up --build

down:
	docker compose --profile full --profile mock down

lint-api:   ## validate the API contract
	docker run --rm -v "$(CURDIR)/docs/api":/spec -w /spec redocly/cli lint openapi.yaml

types:      ## generate frontend types from the contract
	cd frontend && npm run api:types

test:       ## backend tests
	cd backend && python -m pytest

smoke:      ## check a running API
	sh scripts/smoke.sh $(API)
