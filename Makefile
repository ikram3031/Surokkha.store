.PHONY: deploy build build-backend build-dashboard build-bg build-dash sync-config logs logs-backend logs-dashboard status down help

# ── Dynamic Client Configuration Detection ────────────────────
# Accepts CLIENT from command line (e.g. make deploy CLIENT=demo)
# Or auto-detects from existing VPS directories (/opt/<client>)
CLIENT ?= $(shell if [ -f .client ]; then cat .client | tr -d ' \r\n'; \
	elif [ -n "$$CLIENT_NAME" ]; then echo "$$CLIENT_NAME"; \
	elif [ -n "$$CLIENT" ]; then echo "$$CLIENT"; \
	elif [ -f configs/$$(hostname 2>/dev/null).json ]; then hostname 2>/dev/null; \
	elif [ -f /etc/hostname ] && [ -f configs/$$(cat /etc/hostname 2>/dev/null | tr -d ' \r\n').json ]; then cat /etc/hostname | tr -d ' \r\n'; \
	elif [ -d /opt/$$(hostname 2>/dev/null)/configs ]; then hostname 2>/dev/null; \
	elif [ -f .env ]; then echo local; \
	else echo demo; fi)

# Resolve the config env file path
ENV_FILE ?= $(shell if [ -f .env ]; then echo .env; \
	elif [ -f /opt/$(CLIENT)/configs/backend.env ]; then echo /opt/$(CLIENT)/configs/backend.env; \
	elif [ -f /opt/$(CLIENT)/configs/.env ]; then echo /opt/$(CLIENT)/configs/.env; \
	else echo .env; fi)

COMPOSE = CLIENT_NAME=$(CLIENT) CLIENT_CONFIG_PATH=/opt/$(CLIENT)/configs docker compose --env-file $(ENV_FILE) -f docker-compose.prod.yml

# ── Targets ───────────────────────────────────────────────────

help:
	@echo "White-Label Multi-Tenant Deployment Automation"
	@echo "Active Client: $(CLIENT)"
	@echo "Env File:      $(ENV_FILE)"
	@echo ""
	@echo "Available commands:"
	@echo "  make sync-config        Sync centralized client config to backend & dashboard"
	@echo "  make deploy             Pull latest, sync config & rebuild both backend + dashboard"
	@echo "  make build-backend      Pull latest, sync config & rebuild backend container"
	@echo "  make build-dashboard    Pull latest, sync config & rebuild dashboard container"
	@echo "  make status             Show running container status"
	@echo "  make logs               View all container logs"
	@echo "  make logs-backend       View backend container logs"
	@echo "  make logs-dashboard     View dashboard container logs"
	@echo "  make down               Stop all client containers"
	@echo ""
	@echo "Override client manually:"
	@echo "  make deploy CLIENT=<tenant_key>"

sync-config:
	@node scripts/sync-config.js $(CLIENT) 2>/dev/null || true

deploy:
	@echo "🚀 Deploying for client [$(CLIENT)] using config [$(ENV_FILE)]..."
	git pull origin Live
	@node scripts/sync-config.js $(CLIENT) 2>/dev/null || true
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d --force-recreate
	@docker builder prune -f 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@node scripts/purge-cf.js $(CLIENT) 2>/dev/null || true
	@echo "✓ Full Deployment and Cache Purge complete for [$(CLIENT)]!"

build: deploy

build-backend:
	@echo "🚀 Rebuilding Backend for client [$(CLIENT)]..."
	git pull origin Live
	@node scripts/sync-config.js $(CLIENT) 2>/dev/null || true
	$(COMPOSE) build --no-cache backend
	$(COMPOSE) up -d --force-recreate backend
	@docker builder prune -f 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Backend rebuild complete!"

build-bg: build-backend

build-dashboard:
	@echo "🚀 Rebuilding Dashboard for client [$(CLIENT)]..."
	git pull origin Live
	@node scripts/sync-config.js $(CLIENT) 2>/dev/null || true
	$(COMPOSE) build --no-cache dashboard
	$(COMPOSE) up -d --force-recreate dashboard
	@docker builder prune -f 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@node scripts/purge-cf.js $(CLIENT) 2>/dev/null || true
	@echo "✓ Dashboard rebuild, Docker recreation, Nginx reload & Cloudflare purge complete!"

build-dash: build-dashboard

purge-cf:
	@node scripts/purge-cf.js $(CLIENT) 2>/dev/null || true

status:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend

logs-bg: logs-backend

logs-dashboard:
	$(COMPOSE) logs -f dashboard

logs-dash: logs-dashboard

down:
	$(COMPOSE) down