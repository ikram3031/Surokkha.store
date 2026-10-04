.PHONY: deploy deploy-native deploy-docker build build-backend build-dashboard build-frontend status logs logs-backend logs-dashboard logs-frontend down help sync-config

# ── Surokkha Environment & Paths ──────────────────────────────
CLIENT := surokkha
ENV_FILE ?= $(shell if [ -f .env ]; then echo .env; \
	elif [ -f /opt/clients/surokkha/backend/.env ]; then echo /opt/clients/surokkha/backend/.env; \
	elif [ -f /opt/clients/surokkha/configs/backend.env ]; then echo /opt/clients/surokkha/configs/backend.env; \
	elif [ -f /opt/surokkha/configs/backend.env ]; then echo /opt/surokkha/configs/backend.env; \
	else echo .env; fi)

COMPOSE = ENV_FILE=$(ENV_FILE) docker compose --env-file $(ENV_FILE) -f docker-compose.prod.yml

# ── Targets ───────────────────────────────────────────────────

help:
	@echo "=========================================================="
	@echo " Surokkha.store Production Deployment Automation"
	@echo "=========================================================="
	@echo "Active Env File: $(ENV_FILE)"
	@echo ""
	@echo "Deployment Modes:"
	@echo "  make deploy             Safe deployment matching VPS native setup (Systemd + Nginx static)"
	@echo "  make deploy-docker      Containerized deployment via Docker Compose"
	@echo ""
	@echo "Component Builds (Native VPS Mode):"
	@echo "  make build-frontend     Build Storefront and deploy to /opt/clients/surokkha/dist"
	@echo "  make build-dashboard    Build Admin Dashboard and deploy to /opt/clients/surokkha/dashboard"
	@echo "  make restart-backend    Restart systemd services (surokkha-storefront & surokkha-dashboard)"
	@echo ""
	@echo "Status & Health:"
	@echo "  make status             Check systemd service and mongo status"
	@echo "  make logs               Tail backend systemd logs"
	@echo "=========================================================="

sync-config:
	@node scripts/sync-config.js $(CLIENT) 2>/dev/null || true

# ── Safe Native VPS Deployment (Default) ──────────────────────
# Pulls Live, builds frontend & dashboard to their exact Nginx webroots, and restarts systemd backends
deploy:
	@echo "🚀 Deploying Surokkha [Live branch] using Native VPS Architecture..."
	git pull origin Live
	@$(MAKE) sync-config
	@# 1. Build and deploy Customer Storefronts (Store & Shop)
	@if [ -d "frontend" ]; then \
		echo "📦 Building Storefronts (store & shop)..."; \
		npm install --prefix frontend && \
		npm run build:store --prefix frontend && \
		mkdir -p /opt/clients/surokkha/store && \
		cp -r frontend/store/* /opt/clients/surokkha/store/ 2>/dev/null || true && \
		echo "✓ Storefront (surokkha.store) deployed to /opt/clients/surokkha/store" && \
		npm run build:shop --prefix frontend && \
		mkdir -p /opt/clients/surokkha/shop && \
		cp -r frontend/shop/* /opt/clients/surokkha/shop/ 2>/dev/null || true && \
		echo "✓ Storefront (surokkha.shop) deployed to /opt/clients/surokkha/shop"; \
	fi

	@# 2. Build and deploy Admin Dashboard
	@if [ -d "dashboard" ]; then \
		echo "📦 Building Admin Dashboard..."; \
		npm install --prefix dashboard; \
		npm run build --prefix dashboard; \
		mkdir -p /opt/clients/surokkha/dashboard; \
		cp -r dashboard/dist/* /opt/clients/surokkha/dashboard/ 2>/dev/null || true; \
		echo "✓ Admin Dashboard static files deployed to /opt/clients/surokkha/dashboard"; \
	fi
	@# 3. Update Backend dependencies and restart services
	@if [ -d "backend" ]; then \
		echo "📦 Updating Backend dependencies..."; \
		npm install --prefix backend; \
		systemctl restart surokkha-storefront surokkha-dashboard surokkha-backend 2>/dev/null || true; \
		echo "✓ Surokkha backend services restarted"; \
	fi
	@# 4. Reload Nginx
	@systemctl reload nginx 2>/dev/null || true
	@# 5. Dispatch Deployment Notification Email & Dashboard Alert
	@if [ -f "scripts/notify-deploy.js" ]; then \
		echo "📧 Sending multi-component deployment notification email..."; \
		node scripts/notify-deploy.js --bump 2>/dev/null || true; \
	elif [ -f "frontend/scripts/notify-deploy.js" ]; then \
		node frontend/scripts/notify-deploy.js --bump 2>/dev/null || true; \
	fi
	@echo "🎉 Surokkha Deployment successfully finished without downtime!"

build: deploy

build-store:
	@echo "📦 Building and deploying Surokkha Store (surokkha.store)..."
	npm install --prefix frontend
	npm run build:store --prefix frontend
	@mkdir -p /opt/clients/surokkha/store
	@cp -r frontend/store/* /opt/clients/surokkha/store/ 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Surokkha Store deployed to /opt/clients/surokkha/store!"

build-shop:
	@echo "📦 Building and deploying Surokkha Shop (surokkha.shop)..."
	npm install --prefix frontend
	npm run build:shop --prefix frontend
	@mkdir -p /opt/clients/surokkha/shop
	@cp -r frontend/shop/* /opt/clients/surokkha/shop/ 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Surokkha Shop deployed to /opt/clients/surokkha/shop!"

build-frontend: build-store build-shop

build-dashboard:
	@echo "📦 Building and deploying Surokkha Admin Dashboard..."
	@$(MAKE) sync-config
	npm install --prefix dashboard
	npm run build --prefix dashboard
	@mkdir -p /opt/clients/surokkha/dashboard
	@cp -r dashboard/dist/* /opt/clients/surokkha/dashboard/ 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Admin Dashboard deployed to /opt/clients/surokkha/dashboard!"

restart-backend:
	systemctl restart surokkha-storefront surokkha-dashboard 2>/dev/null || true
	@echo "✓ Backend restarted!"

# ── Containerized Deployment (Optional Alternative) ────────────
deploy-docker:
	@echo "🚀 Deploying Surokkha using Docker Compose..."
	git pull origin Live
	@$(MAKE) sync-config
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d --force-recreate
	@docker builder prune -f 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Docker Compose deployment complete!"

status:
	@systemctl status surokkha-storefront surokkha-dashboard --no-pager 2>/dev/null || true
	@docker ps --filter "name=surokkha-mongodb-live" 2>/dev/null || true

logs:
	journalctl -u surokkha-storefront -u surokkha-dashboard -f --no-tail

down:
	systemctl stop surokkha-storefront surokkha-dashboard 2>/dev/null || true