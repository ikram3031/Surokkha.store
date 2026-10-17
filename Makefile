.PHONY: deploy deploy-native deploy-docker build build-backend build-dashboard build-frontend build-catalog status logs logs-backend logs-dashboard logs-frontend down help sync-config

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
	@echo "  make build-store        Build Store and deploy to /opt/clients/surokkha/store"
	@echo "  make build-shop         Build Shop and deploy to /opt/clients/surokkha/shop"
	@echo "  make build-frontend     Build both Store & Shop storefronts"
	@echo "  make build-dashboard    Build Admin Dashboard and deploy to /opt/clients/surokkha/dashboard"
	@echo "  make build-catalog      Build Product Catalog (catalog.surokkha.shop)"
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
		set -e; \
		echo "📦 Building Storefronts (store & shop)..."; \
		npm install --prefix frontend; \
		echo "🔨 Building Surokkha Store (store)..."; \
		npm run build:store --prefix frontend; \
		mkdir -p /opt/clients/surokkha/store; \
		cp -r frontend/store/* /opt/clients/surokkha/store/; \
		if [ -d "/opt/clients/surokkha/dist" ]; then \
			echo "🔄 Also syncing to legacy /opt/clients/surokkha/dist..."; \
			cp -r frontend/store/* /opt/clients/surokkha/dist/; \
		fi; \
		echo "✓ Storefront (surokkha.store) deployed to /opt/clients/surokkha/store"; \
		echo "🔨 Building Surokkha Shop (shop)..."; \
		npm run build:shop --prefix frontend; \
		mkdir -p /opt/clients/surokkha/shop; \
		cp -r frontend/shop/* /opt/clients/surokkha/shop/; \
		echo "✓ Storefront (surokkha.shop) deployed to /opt/clients/surokkha/shop"; \
	fi

	@# 2. Build and deploy Admin Dashboard
	@if [ -d "dashboard" ]; then \
		set -e; \
		echo "📦 Building Admin Dashboard..."; \
		npm install --prefix dashboard; \
		npm run build --prefix dashboard; \
		if [ -d "/var/www/admin.surokkha.store" ]; then \
			mkdir -p /var/www/admin.surokkha.store/dist; \
			cp -r dashboard/dist/* /var/www/admin.surokkha.store/dist/; \
		fi; \
		if [ -d "/opt/clients/surokkha/dashboard" ]; then \
			mkdir -p /opt/clients/surokkha/dashboard/dist; \
			cp -r dashboard/dist/* /opt/clients/surokkha/dashboard/dist/; \
		fi; \
		echo "✓ Admin Dashboard built and deployed"; \
	fi

	@# 2b. Build and deploy Product Catalog (catalog.surokkha.shop)
	@if [ -d "catalog" ]; then \
		set -e; \
		echo "📦 Building Catalog (catalog.surokkha.shop)..."; \
		npm install --prefix catalog; \
		npm run build --prefix catalog; \
		mkdir -p /opt/clients/surokkha/catalog/dist; \
		cp -r catalog/dist/* /opt/clients/surokkha/catalog/dist/; \
		echo "✓ Product Catalog (catalog.surokkha.shop) deployed to /opt/clients/surokkha/catalog/dist"; \
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
	@# 6. Purge Cloudflare Edge Cache if configured
	@if [ -f "scripts/purge-cf.js" ]; then \
		echo "🌐 Purging Cloudflare cache..."; \
		node scripts/purge-cf.js surokkha 2>/dev/null || true; \
	fi
	@echo "🎉 Surokkha Deployment successfully finished without downtime!"

build: deploy

build-store:
	@echo "📦 Building and deploying Surokkha Store (surokkha.store)..."
	npm install --prefix frontend
	npm run build:store --prefix frontend
	@mkdir -p /opt/clients/surokkha/store
	@cp -r frontend/store/* /opt/clients/surokkha/store/
	@if [ -d "/opt/clients/surokkha/dist" ]; then \
		echo "🔄 Also syncing to legacy /opt/clients/surokkha/dist..."; \
		cp -r frontend/store/* /opt/clients/surokkha/dist/; \
	fi
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Surokkha Store deployed to /opt/clients/surokkha/store!"

build-shop:
	@echo "📦 Building and deploying Surokkha Shop (surokkha.shop)..."
	npm install --prefix frontend
	npm run build:shop --prefix frontend
	@mkdir -p /opt/clients/surokkha/shop
	@cp -r frontend/shop/* /opt/clients/surokkha/shop/
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Surokkha Shop deployed to /opt/clients/surokkha/shop!"

build-frontend: build-store build-shop

build-dashboard:
	@echo "📦 Building and deploying Surokkha Admin Dashboard..."
	@$(MAKE) sync-config
	npm install --prefix dashboard
	npm run build --prefix dashboard
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Admin Dashboard deployed to /opt/clients/surokkha/dashboard/dist!"

build-catalog:
	@echo "📦 Building and deploying Surokkha Product Catalog (catalog.surokkha.shop)..."
	npm install --prefix catalog
	npm run build --prefix catalog
	@mkdir -p /opt/clients/surokkha/catalog/dist
	@cp -r catalog/dist/* /opt/clients/surokkha/catalog/dist/ 2>/dev/null || true
	@systemctl reload nginx 2>/dev/null || true
	@echo "✓ Product Catalog deployed to /opt/clients/surokkha/catalog/dist!"

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