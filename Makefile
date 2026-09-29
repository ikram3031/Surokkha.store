.PHONY: deploy build build-backend build-dashboard build-frontend status logs logs-backend logs-dashboard logs-frontend down help sync-config

# ── Surokkha Environment & Docker Compose Settings ─────────────
CLIENT := surokkha
ENV_FILE ?= $(shell if [ -f .env ]; then echo .env; \
	elif [ -f /opt/clients/surokkha/configs/backend.env ]; then echo /opt/clients/surokkha/configs/backend.env; \
	elif [ -f /opt/surokkha/configs/backend.env ]; then echo /opt/surokkha/configs/backend.env; \
	else echo .env; fi)

COMPOSE = ENV_FILE=$(ENV_FILE) docker compose --env-file $(ENV_FILE) -f docker-compose.prod.yml

# ── Targets ───────────────────────────────────────────────────

help:
	@echo "=========================================================="
	@echo " Surokkha.store Production Deployment Automation"
	@echo "=========================================================="
	@echo "Env File: $(ENV_FILE)"
	@echo ""
	@echo "Available commands:"
	@echo "  make deploy             Pull latest from Live & build/recreate all services"
	@echo "  make build-backend      Rebuild Storefront & Dashboard backend services"
	@echo "  make build-dashboard    Rebuild Admin Dashboard container"
	@echo "  make build-frontend     Rebuild Customer Storefront container"
	@echo "  make status             Show running Surokkha containers"
	@echo "  make logs               Tail all container logs"
	@echo "  make logs-backend       Tail backend logs"
	@echo "  make logs-dashboard     Tail dashboard logs"
	@echo "  make logs-frontend      Tail frontend logs"
	@echo "  make down               Stop all Surokkha containers"
	@echo "=========================================================="

sync-config:
	@node scripts/sync-config.js $(CLIENT) 2>/dev/null || true

deploy:
	@echo "🚀 Deploying Surokkha [Live branch] using env [$(ENV_FILE)]..."
	git pull origin Live
	@$(MAKE) sync-config
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d --force-recreate
	@docker builder prune -f 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Surokkha Full Deployment complete!"

build: deploy

build-backend:
	@echo "🚀 Rebuilding Surokkha Backend services..."
	git pull origin Live
	$(COMPOSE) build --no-cache backend-storefront backend-dashboard
	$(COMPOSE) up -d --force-recreate backend-storefront backend-dashboard
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Backend services rebuilt successfully!"

build-dashboard:
	@echo "🚀 Rebuilding Surokkha Admin Dashboard..."
	git pull origin Live
	@$(MAKE) sync-config
	$(COMPOSE) build --no-cache dashboard
	$(COMPOSE) up -d --force-recreate dashboard
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Admin Dashboard rebuilt successfully!"

build-frontend:
	@echo "🚀 Rebuilding Surokkha Frontend..."
	git pull origin Live
	$(COMPOSE) build --no-cache frontend
	$(COMPOSE) up -d --force-recreate frontend
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Frontend rebuilt successfully!"

status:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend-storefront backend-dashboard

logs-dashboard:
	$(COMPOSE) logs -f dashboard

logs-frontend:
	$(COMPOSE) logs -f frontend

down:
	$(COMPOSE) down